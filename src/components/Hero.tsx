import { motion } from 'motion/react';

export const Hero = () => {
  return (
    <section className="min-h-screen flex items-center pt-20" id="hero-section">
      <div className="max-w-6xl mx-auto w-full px-6 md:px-10">
        <div className="max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.2] mb-8 text-black"
            id="hero-title"
          >
            <span className="whitespace-nowrap inline-block">경북대학교 대구캠퍼스</span>
            <br />
            <span className="text-[#100d64] whitespace-nowrap inline-block mt-2">생물다양성 모니터링</span>
          </motion.h1>
        </div>
      </div>
    </section>
  );
};
