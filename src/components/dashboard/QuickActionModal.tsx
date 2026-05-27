import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../../contexts/AppContext';
import { ApiError } from '../../api/client';
import ThemeSelect from '../ThemeSelect';
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
  const [taskProjectId, setTaskProjectId] = useState('');
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
  const [submitting, setSubmitting] = useState(false);

  if (!ctx) return null;
  const {
    quickActionModal,
    quickActionProjectId,
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

  const workspaceProjects = projects.filter((p) => p.workspaceId === activeWorkspace?.id);

  const projectOptions = useMemo(
    () => workspaceProjects.map((p) => ({ value: p.id, label: p.name })),
    [workspaceProjects]
  );

  const statusOptions: { value: Task['status']; label: Task['status'] }[] = [
    { value: 'To Do', label: 'To Do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'In Review', label: 'In Review' },
    { value: 'Done', label: 'Done' },
  ];

  const inviteRoleOptions = [
    { value: 'Member', label: 'Member' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Viewer', label: 'Viewer' },
  ] as const;

  const snippetLangOptions = [
    { value: 'TypeScript', label: 'TypeScript' },
    { value: 'JavaScript', label: 'JavaScript' },
    { value: 'Python', label: 'Python' },
    { value: 'CSS', label: 'CSS' },
  ];

  useEffect(() => {
    if (!quickActionModal) return;
    const preferred = quickActionProjectId && workspaceProjects.some((p) => p.id === quickActionProjectId)
      ? quickActionProjectId
      : workspaceProjects[0]?.id ?? '';
    setTaskProjectId(preferred);
  }, [quickActionModal, quickActionProjectId, workspaceProjects]);

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
    setSubmitting(false);
    setQuickActionModal(null);
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      switch (quickActionModal) {
        case 'task':
          if (!taskTitle.trim()) {
            showToast('Enter a task title');
            return;
          }
          if (!taskProjectId) {
            showToast('Create a project first, then add tasks to it');
            return;
          }
          await createTask({ title: taskTitle.trim(), projectId: taskProjectId, status: taskStatus });
          showToast('Task created');
          break;
        case 'project':
          if (!projectName.trim()) {
            showToast('Enter a project name');
            return;
          }
          await createProject({
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
          await inviteMember(inviteEmail.trim(), inviteRole);
          showToast(`Invite sent to ${inviteEmail}`);
          break;
        case 'snippet':
          if (!snippetTitle.trim()) return;
          await createSnippet({ title: snippetTitle.trim(), language: snippetLang, code: snippetCode || '// new snippet' });
          showToast('Snippet added');
          break;
        case 'document':
          if (!docTitle.trim()) return;
          await createDoc({ title: docTitle.trim(), body: docBody || 'Start writing…' });
          showToast('Document created');
          break;
        case 'report': {
          if (reportPreview) {
            resetAndClose();
            return;
          }
          const result = await generateAIReport();
          setReportPreview(result.report);
          showToast('AI report generated');
          return;
        }
      }
      resetAndClose();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Action failed — is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={resetAndClose}>
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
        <div className="overline">Quick Action</div>
        <h2 style={{ margin: '8px 0 20px' }}>{titles[quickActionModal]}</h2>

        {quickActionModal === 'task' && (
          <>
            {workspaceProjects.length === 0 ? (
              <div className="surface-card" style={{ marginBottom: 12 }}>
                <p className="page-lead" style={{ marginBottom: 12 }}>You need a project before adding tasks.</p>
                <Link to="/projects" className="glow-button" style={{ display: 'inline-flex' }} onClick={resetAndClose}>
                  Go to Projects
                </Link>
              </div>
            ) : (
              <>
                <ThemeSelect
                  value={taskProjectId}
                  onChange={setTaskProjectId}
                  options={projectOptions}
                />
                <input className="input-field" placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                <ThemeSelect
                  value={taskStatus}
                  onChange={(value) => setTaskStatus(value as Task['status'])}
                  options={statusOptions}
                />
              </>
            )}
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
            <ThemeSelect
              value={inviteRole}
              onChange={(value) => setInviteRole(value as typeof inviteRole)}
              options={[...inviteRoleOptions]}
            />
          </>
        )}
        {quickActionModal === 'snippet' && (
          <>
            <input className="input-field" placeholder="Snippet title" value={snippetTitle} onChange={(e) => setSnippetTitle(e.target.value)} />
            <ThemeSelect
              value={snippetLang}
              onChange={setSnippetLang}
              options={snippetLangOptions}
            />
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
            <p className="page-header-desc">
              AI will analyze task movement, team activity, and sprint health to generate your standup report.
            </p>
            {reportPreview && (
              <pre className="report-preview">{reportPreview}</pre>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            className="glow-button"
            style={{ flex: 1 }}
            onClick={handleCreate}
            disabled={submitting || (quickActionModal === 'task' && workspaceProjects.length === 0)}
          >
            {submitting ? 'Saving…' : quickActionModal === 'report' ? (reportPreview ? 'Close' : 'Generate') : 'Create'}
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
