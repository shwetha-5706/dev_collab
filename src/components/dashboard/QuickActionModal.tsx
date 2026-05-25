import { useContext, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import type { QuickActionType, Task } from '../../types';

const titles: Record<QuickActionType, string> = {
  task: 'Create Task',
  project: 'Create Project',
  invite: 'Invite Member',
  snippet: 'Add Snippet',
  document: 'Create Document',
  report: 'Generate AI Report',
};

const QuickActionModal = () => {
  const ctx = useContext(AppContext);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskStatus, setTaskStatus] = useState<Task['status']>('To Do');
  const [projectName, setProjectName] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Member' | 'Admin' | 'Viewer'>('Member');
  const [snippetTitle, setSnippetTitle] = useState('');
  const [snippetLang, setSnippetLang] = useState('TypeScript');
  const [snippetCode, setSnippetCode] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docBody, setDocBody] = useState('');
  const [reportPreview, setReportPreview] = useState('');

  if (!ctx) return null;
  const {
    quickActionModal,
    setQuickActionModal,
    createTask,
    createProject,
    inviteMember,
    createSnippet,
    createDoc,
    generateAIReport,
    projects,
    activeWorkspace,
    showToast,
  } = ctx;

  if (!quickActionModal) return null;

  const resetAndClose = () => {
    setTaskTitle('');
    setProjectName('');
    setInviteEmail('');
    setSnippetTitle('');
    setSnippetCode('');
    setDocTitle('');
    setDocBody('');
    setReportPreview('');
    setQuickActionModal(null);
  };

  const workspaceProjects = projects.filter((p) => p.workspaceId === activeWorkspace?.id);
  const defaultProjectId = workspaceProjects[0]?.id ?? '';

  const handleCreate = () => {
    switch (quickActionModal) {
      case 'task':
        if (!taskTitle.trim() || !defaultProjectId) return;
        createTask({ title: taskTitle.trim(), projectId: defaultProjectId, status: taskStatus });
        showToast('Task created');
        break;
      case 'project':
        if (!projectName.trim()) return;
        createProject({
          name: projectName.trim(),
          deadline: projectDeadline || new Date().toISOString().slice(0, 10),
          stack: [],
          priority: 'P2',
          visibility: 'Private',
        });
        showToast('Project created');
        break;
      case 'invite':
        if (!inviteEmail.trim()) return;
        inviteMember(inviteEmail.trim(), inviteRole);
        showToast(`Invite sent to ${inviteEmail}`);
        break;
      case 'snippet':
        if (!snippetTitle.trim()) return;
        createSnippet({ title: snippetTitle.trim(), language: snippetLang, code: snippetCode || '// new snippet' });
        showToast('Snippet added');
        break;
      case 'document':
        if (!docTitle.trim()) return;
        createDoc({ title: docTitle.trim(), body: docBody || 'Start writing…' });
        showToast('Document created');
        break;
      case 'report': {
        if (reportPreview) {
          resetAndClose();
          return;
        }
        const report = generateAIReport();
        setReportPreview(report);
        showToast('AI report generated');
        return;
      }
    }
    resetAndClose();
  };

  return (
    <div className="modal-overlay" onClick={resetAndClose}>
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
        <div className="overline">Quick Action</div>
        <h2 style={{ margin: '8px 0 20px' }}>{titles[quickActionModal]}</h2>

        {quickActionModal === 'task' && (
          <>
            <input className="input-field" placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
            <select className="input-field" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value as Task['status'])}>
              <option>To Do</option>
              <option>In Progress</option>
              <option>In Review</option>
              <option>Done</option>
            </select>
          </>
        )}
        {quickActionModal === 'project' && (
          <>
            <input className="input-field" placeholder="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            <input className="input-field" placeholder="Deadline" type="date" value={projectDeadline} onChange={(e) => setProjectDeadline(e.target.value)} />
          </>
        )}
        {quickActionModal === 'invite' && (
          <>
            <input className="input-field" placeholder="Email address" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <select className="input-field" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}>
              <option>Member</option>
              <option>Admin</option>
              <option>Viewer</option>
            </select>
          </>
        )}
        {quickActionModal === 'snippet' && (
          <>
            <input className="input-field" placeholder="Snippet title" value={snippetTitle} onChange={(e) => setSnippetTitle(e.target.value)} />
            <select className="input-field" value={snippetLang} onChange={(e) => setSnippetLang(e.target.value)}>
              <option>TypeScript</option>
              <option>JavaScript</option>
              <option>Python</option>
              <option>CSS</option>
            </select>
            <textarea className="input-field" placeholder="Paste code…" rows={4} value={snippetCode} onChange={(e) => setSnippetCode(e.target.value)} />
          </>
        )}
        {quickActionModal === 'document' && (
          <>
            <input className="input-field" placeholder="Document title" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
            <textarea className="input-field" placeholder="Start writing…" rows={4} value={docBody} onChange={(e) => setDocBody(e.target.value)} />
          </>
        )}
        {quickActionModal === 'report' && (
          <>
            <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
              AI will analyze task movement, team activity, and sprint health to generate your standup report.
            </p>
            {reportPreview && (
              <pre className="report-preview">{reportPreview}</pre>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="glow-button" style={{ flex: 1 }} onClick={handleCreate}>
            {quickActionModal === 'report' ? (reportPreview ? 'Close' : 'Generate') : 'Create'}
          </button>
          <button className="glow-button secondary" style={{ flex: 1 }} onClick={resetAndClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActionModal;
