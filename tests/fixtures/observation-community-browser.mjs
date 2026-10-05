import React, { Component, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ObservationDetail } from '../../src/components/ObservationDetail.tsx';
import { createMockCommentRepository } from '../../src/repositories/mockCommentRepository.ts';
import { communityObservation, createCommentFixture } from './observation-comments.mjs';
import '../../src/index.css';

const h = React.createElement;
const roles = ['anonymous', 'owner', 'other', 'admin'];
const labels = ['비로그인', '작성자', '다른 사용자', '관리자'];
let observation = { ...communityObservation };
let session = { user: null, profile: null, isAdmin: false };
const comments = createMockCommentRepository({
  initialComments: createCommentFixture(),
  getObservation: async (id) => observation?.id === id ? observation : null,
  getSession: async () => session,
});

class FixtureBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Fixture({ onReady }) {
  const [role, setRole] = useState('anonymous');
  const [open, setOpen] = useState(true);
  const [deleted, setDeleted] = useState(false);
  session = role === 'anonymous' ? { user: null, profile: null, isAdmin: false } : {
    user: { id: role === 'owner' ? 'fixture-author' : role === 'other' ? 'fixture-other' : 'fixture-admin' },
    profile: { displayName: '격리 작성자' }, isAdmin: role === 'admin',
  };
  useEffect(onReady, []);
  return h(React.Fragment, null,
    h('header', { className: 'fixed inset-x-0 top-0 z-[110] flex flex-wrap items-center gap-3 border-b bg-white p-3 text-sm' },
      h('span', null, '격리 자료 · 댓글 27개 · 메모리 전용'),
      h('label', null, '테스트 역할 ', h('select', { value: role, onChange: (event) => setRole(event.target.value), className: 'border p-2' },
        roles.map((value, index) => h('option', { key: value, value }, labels[index])))),
      !deleted && !open && h('button', { type: 'button', onClick: () => setOpen(true), className: 'border p-2' }, '상세 열기')),
    deleted && h('p', { role: 'status', className: 'p-6 pt-32' }, '격리 관찰과 댓글이 삭제되었습니다. 새로고침하면 초기 자료로 돌아옵니다.'),
    open && !deleted && h(ObservationDetail, {
      observation, authState: session, commentRepository: comments.repository,
      canDelete: role === 'owner' || role === 'admin', onClose: () => setOpen(false),
      onDeleteObservation: async (id) => {
        if (!session.user || (!session.isAdmin && session.user.id !== observation?.observerId)) throw new Error('Not allowed');
        comments.cascadeObservation(id); observation = null; setDeleted(true); setOpen(false);
      },
    }));
}

export const mountCommunityFixture = (root, onReady, onError) => {
  createRoot(root).render(h(FixtureBoundary, { onError }, h(Fixture, { onReady })));
};
