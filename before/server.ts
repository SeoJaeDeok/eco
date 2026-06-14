import express from "express";
import path from "path";
import multer from "multer";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { initializeFirestore, setLogLevel, collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from "firebase/firestore";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "150mb" }));
  app.use(express.urlencoded({ limit: "150mb", extended: true }));

  // Diagnostic request logger that persists logs to ./server_log.txt
  app.use((req, res, next) => {
    try {
      const logLine = `[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.url} - Content-Type: ${req.headers["content-type"] || "none"}\n`;
      fs.appendFileSync(path.join(process.cwd(), "server_log.txt"), logLine);
    } catch (e) {
      // Ignore write errors to keep server running
    }
    next();
  });

  // Check if process.env.NODE_ENV is production, or probe if standard public paths are writable.
  // Cloud Run containers are serverless and can contain a read-only application directory.
  const isProd = process.env.NODE_ENV === "production";
  let useTmpDirs = isProd;

  if (!isProd) {
    try {
      const testDir = path.join(process.cwd(), "public", "data");
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      const testFile = path.join(testDir, ".write-test");
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);
    } catch (e) {
      console.warn("⚠️ Local public directories are not writable. Falling back to robust /tmp storage.");
      useTmpDirs = true;
    }
  }

  const uploadDir = useTmpDirs ? "/tmp/uploads" : path.join(process.cwd(), "public", "uploads");
  const permanentDir = useTmpDirs ? "/tmp/observations" : path.join(process.cwd(), "public", "observations");
  const dataDir = useTmpDirs ? "/tmp/data" : path.join(process.cwd(), "public", "data");
  const dataPath = path.join(dataDir, "observations.json");

  // Create dirs in a guaranteed writable place
  [uploadDir, permanentDir, dataDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Seed default data if using temp directories and data does not exist yet
  if (useTmpDirs) {
    const originalDataPath = path.join(process.cwd(), "public", "data", "observations.json");
    if (fs.existsSync(originalDataPath) && !fs.existsSync(dataPath)) {
      try {
        fs.copyFileSync(originalDataPath, dataPath);
        console.log("➡️ Template observations.json cloned to /tmp data storage successfully!");
      } catch (copyErr) {
        console.warn("⚠️ Could not clone template observations.json to /tmp storage:", copyErr);
      }
    }
  }

  let db: any = null;
  let isFirestoreAvailable = false;

  // Verify connection to Firestore on server startup via Web Client/Web SDK
  try {
    const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(firebaseConfigPath)) {
      console.log("ℹ️ Firestore config file missing. Firestore background backup will be disabled.");
    } else {
      const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
      const firebaseApp = initializeApp(firebaseConfig);
      setLogLevel("error");
      db = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: true
      }, firebaseConfig.firestoreDatabaseId);
      
      // Test the connection with a query checks
      const q = query(collection(db, 'observations'));
      await getDocs(q);
      isFirestoreAvailable = true;
      console.log("✅ Cloud Firestore Web SDK connection is fully active and accessible!");
    }
  } catch (err: any) {
    console.log("ℹ️ Cloud Firestore background backup is inactive (using local storage fallback):", err.message || err);
  }

  // Multer configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Save directly to the permanent observations folder
      cb(null, permanentDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, "obs-" + uniqueSuffix + ext);
    },
  });

  const upload = multer({ storage: storage });

  // API Routes
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    console.log(`[UPLOAD DEBUG] Received POST /api/upload. Content-Type: ${req.headers["content-type"]}`);
    console.log("[UPLOAD DEBUG] Multer successfully handled file. File info:", req.file ? `Present (${req.file.filename})` : "Missing");

    if (!req.file) {
      console.error("[UPLOAD DEBUG] No file parsed. Expected field name 'image'");
      return res.status(400).json({ 
        error: "No file uploaded. Please ensure the field name is 'image' and the file size is reasonable." 
      });
    }

    let imageUrl = `/observations/${req.file.filename}`;
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64Str = fileBuffer.toString("base64");
      const mimeType = req.file.mimetype || "image/jpeg";
      imageUrl = `data:${mimeType};base64,${base64Str}`;
      console.log("[UPLOAD DEBUG] Converted uploaded file to base64. Base64 length:", imageUrl.length);
      
      // Clean up local temp file as we are storing it in base64 in Firestore and local JSON
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.warn("[UPLOAD DEBUG] Could not remove temp file:", unlinkErr);
      }
    } catch (base64Err) {
      console.error("[UPLOAD DEBUG] Error encoding image to base64:", base64Err);
    }

    try {
      if (!req.body || !req.body.metadata) {
        console.warn("[UPLOAD DEBUG] No metadata body text found in transaction");
      }

      const metadata = JSON.parse(req.body?.metadata || "{}");
      console.log("[UPLOAD DEBUG] Metadata successfully parsed:", metadata.name || "unnamed");

      const newObs = {
        id: "user-" + Date.now(),
        ...metadata,
        imageUrl,
        isFixed: false,
        date: metadata.date || new Date().toISOString().slice(0, 10)
      };

      let observations = [];
      if (fs.existsSync(dataPath)) {
        try {
          const content = fs.readFileSync(dataPath, "utf8");
          observations = JSON.parse(content || "[]");
        } catch (e) {
          console.error("[UPLOAD DEBUG] Error reading observations JSON store file:", e);
          observations = [];
        }
      }

      observations.push(newObs);
      fs.writeFileSync(dataPath, JSON.stringify(observations, null, 2));
      console.log("[UPLOAD DEBUG] Record committed to fallback JSON data storage.");

      // Try background backup to Firestore (gracefully caught so it never impacts user UI)
      if (isFirestoreAvailable && db) {
        const docRef = doc(db, "observations", newObs.id);
        setDoc(docRef, {
          name: newObs.name,
          scientificName: newObs.scientificName || "",
          taxon: newObs.taxon,
          location: newObs.location,
          date: newObs.date,
          description: newObs.description || "",
          coords: newObs.coords,
          imageUrl: newObs.imageUrl,
          createdAt: new Date().toISOString()
        }).then(() => {
          console.log("[UPLOAD DEBUG] Firestore background backup completed successfully via SDK!");
        }).catch((fErr) => {
          console.warn("[UPLOAD DEBUG] Firestore background backup skipped/failed:", fErr instanceof Error ? fErr.message : String(fErr));
        });
      }

      return res.json({ imageUrl, observation: newObs });
    } catch (procErr: any) {
      console.error("[UPLOAD DEBUG] Post-upload metadata save error:", procErr);
      return res.status(500).json({
        error: "파일은 업로드되었으나, 메타데이터 연동 중 서버 오류가 발생했습니다.",
        imageUrl
      });
    }
  });

  // Batch sync endpoint for user data storage preservation
  app.post("/api/sync-observations", async (req, res) => {
    try {
      const { observations } = req.body;
      if (!Array.isArray(observations)) {
        return res.status(400).json({ error: "Invalid observations format" });
      }

      console.log(`[SYNC DEBUG] Received ${observations.length} items to backup and sync.`);
      
      // Load current local observations
      let currentLocals: any[] = [];
      if (fs.existsSync(dataPath)) {
        try {
          const content = fs.readFileSync(dataPath, "utf-8");
          currentLocals = JSON.parse(content || "[]");
        } catch (_) {}
      }

      const mergedMap = new Map<string, any>();
      // 1. Populate current storage baseline
      currentLocals.forEach(obs => {
        if (obs && obs.id) mergedMap.set(obs.id, obs);
      });
      // 2. Overwrite or add synced items from user's Chrome LocalStorage state
      observations.forEach(obs => {
        if (obs && obs.id) {
          // Keep base64 image or any properties safely
          mergedMap.set(obs.id, obs);
        }
      });

      const mergedList = Array.from(mergedMap.values());
      // Save permanently to disk
      fs.writeFileSync(dataPath, JSON.stringify(mergedList, null, 2));
      console.log(`[SYNC DEBUG] Synchronized and backed up ${mergedList.length} total records to ${dataPath}`);

      // Optional async firestore backup
      if (isFirestoreAvailable && db) {
        observations.forEach((obs: any) => {
          if (!obs || !obs.id) return;
          const docRef = doc(db, "observations", obs.id);
          setDoc(docRef, {
            name: obs.name,
            scientificName: obs.scientificName || "",
            taxon: obs.taxon || "기타",
            location: obs.location || "",
            date: obs.date || "",
            description: obs.description || "",
            coords: obs.coords || { lat: 35.8888, lng: 128.6103 },
            imageUrl: obs.imageUrl || "",
            createdAt: obs.createdAt || new Date().toISOString()
          }).catch((fErr) => {
            console.warn("[SYNC DEBUG] Firestore async backup failed for ID:", obs.id, fErr?.message);
          });
        });
      }

      return res.json({ success: true, count: mergedList.length });
    } catch (err: any) {
      console.error("[SYNC DEBUG] Bulk sync transaction error:", err);
      return res.status(500).json({ error: "Failed to process backup synchronization: " + err.message });
    }
  });

  app.delete("/api/observations/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`Delete request received for: ${id}`);
    try {
      if (fs.existsSync(dataPath)) {
        const content = fs.readFileSync(dataPath, "utf8");
        let observations = JSON.parse(content || "[]");
        observations = observations.filter((obs: any) => obs.id !== id);
        fs.writeFileSync(dataPath, JSON.stringify(observations, null, 2));
        console.log(`Deleted ${id} from local backup json.`);
      }

      // Background Firestore delete
      if (isFirestoreAvailable && db) {
        deleteDoc(doc(db, 'observations', id))
          .then(() => {
            console.log("Firestore background delete successful via Web SDK!");
          })
          .catch((fErr) => {
            console.warn("Firestore background delete skipped/failed:", fErr instanceof Error ? fErr.message : String(fErr));
          });
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Error deleting observation:", err);
      res.status(500).json({ error: "Failed to delete observation: " + err.message });
    }
  });

  app.delete("/api/observations", async (req, res) => {
    console.log("Delete all user observations requested");
    try {
      let observations: any[] = [];
      if (fs.existsSync(dataPath)) {
        const content = fs.readFileSync(dataPath, "utf8");
        observations = JSON.parse(content || "[]");
      }

      const userObs = observations.filter((obs: any) => !obs.id.startsWith("fixed-"));
      const remainingObs = observations.filter((obs: any) => obs.id.startsWith("fixed-"));
      
      fs.writeFileSync(dataPath, JSON.stringify(remainingObs, null, 2));
      console.log(`Deleted ${userObs.length} user observations from JSON.`);

      // Background Firestore deletion
      if (isFirestoreAvailable && db) {
        Promise.all(userObs.map(obs => deleteDoc(doc(db, 'observations', obs.id))))
          .then(() => {
            console.log("Firestore background delete all successful via Web SDK!");
          })
          .catch((fErr) => {
            console.warn("Firestore background delete all skipped/failed:", fErr instanceof Error ? fErr.message : String(fErr));
          });
      }

      res.json({ success: true, deletedCount: userObs.length });
    } catch (err: any) {
      console.error("Error deleting all observations:", err);
      res.status(500).json({ error: "Failed to delete all observations: " + err.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/observations", async (req, res) => {
    try {
      // 1. Read local observations first
      let localObs: any[] = [];
      if (fs.existsSync(dataPath)) {
        try {
          const content = fs.readFileSync(dataPath, "utf8");
          localObs = JSON.parse(content || "[]");
        } catch (e) {
          console.error("Error reading local observations.json fallback:", e);
        }
      }

      // 2. Fetch Firestore observations if available
      let firestoreObs: any[] = [];
      if (isFirestoreAvailable && db) {
        try {
          const q = query(collection(db, 'observations'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          firestoreObs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || '',
              scientificName: data.scientificName || '',
              taxon: data.taxon || '기타',
              location: data.location || '',
              date: data.date || '',
              description: data.description || '',
              coords: data.coords || { lat: 35.8888, lng: 128.6103 },
              imageUrl: data.imageUrl || ''
            };
          });
          console.log(`Successfully loaded ${firestoreObs.length} records dynamically from Cloud Firestore.`);
        } catch (firestoreErr: any) {
          console.warn("Could not load from Firestore, falling back strictly to local JSON file info:", firestoreErr.message || firestoreErr);
        }
      }

      // 3. SECURE MERGE STRATEGY: Merge both sources by ID to avoid wiping any un-synced local data
      const mergedMap = new Map<string, any>();
      
      // Populate local observations first
      localObs.forEach((obs: any) => {
        if (obs && obs.id) {
          mergedMap.set(obs.id, obs);
        }
      });

      // Overlay with Firestore records
      firestoreObs.forEach((obs: any) => {
        if (obs && obs.id) {
          mergedMap.set(obs.id, obs);
        }
      });

      let mergedObs = Array.from(mergedMap.values());

      // Correct any 곰개미 or 그물등개미 observations that were accidentally registered as '식물' to '곤충'
      mergedObs = mergedObs.map((obs: any) => {
        if (obs && (
          obs.name === '곰개미' || obs.name?.includes('곰개미') ||
          obs.name === '그물등개미' || obs.name?.includes('그물등개미')
        )) {
          return { ...obs, taxon: '곤충' };
        }
        return obs;
      });

      // Keeps local copy synchronized with the fully merged state
      fs.writeFileSync(dataPath, JSON.stringify(mergedObs, null, 2));
      return res.json(mergedObs);
    } catch (err: any) {
      console.error("Error fetching observations:", err);
      res.status(500).json({ error: "Failed to read observations data: " + err.message });
    }
  });

  // Catch-all for missing API routes to prevent serving HTML
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Global API error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global API Error caught:", err);
    try {
      const errorLog = `[ERROR] ${new Date().toISOString()} - ${req.method} ${req.url} - Error: ${err.message || String(err)}\nStack: ${err.stack || ""}\n`;
      fs.appendFileSync(path.join(process.cwd(), "server_log.txt"), errorLog);
    } catch (e) {
      // Ignore log write errors
    }
    
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || err.statusCode || 500).json({
      error: err.message || "An unexpected server error occurred."
    });
  });

  // Serve uploaded files directly from disk instead of relying on Vite copy or bundle in production
  app.use("/observations", express.static(permanentDir));
  // Add static fallback lookup in workspace directory for seeded observations images
  app.use("/observations", express.static(path.join(process.cwd(), "public", "observations")));
  app.use("/uploads", express.static(uploadDir));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
