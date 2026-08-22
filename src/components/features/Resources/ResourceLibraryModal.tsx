import React, { useState, useMemo } from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { CustomSelect } from '../../ui/Select/CustomSelect';
import { Badge } from '../../ui/Badge/Badge';
import { Textarea } from '../../ui/Textarea/Textarea';
import { StudyResource, ResourceType, ReadingStatus } from '../../../types/resource';
import { StudySubject, StudyTopic } from '../../../types/study';
import {
  FileText,
  Book,
  Code,
  Video,
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  Play,
  Bookmark,
  FileEdit
} from 'lucide-react';
import './ResourceLibraryModal.css';

export interface ResourceLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: StudyResource[];
  subjects: StudySubject[];
  topics: StudyTopic[];
  selectedSubjectId?: string;
  selectedTopicId?: string;
  onCreateResource: (resource: Partial<StudyResource>) => Promise<void>;
  onUpdateStatus: (id: string, status: ReadingStatus) => Promise<void>;
  onDeleteResource: (id: string) => Promise<void>;
  onStudyResource: (resource: StudyResource) => void;
  onSynthesizeNote: (resource: StudyResource) => void;
}

const TYPE_ICONS: Record<ResourceType, React.ReactNode> = {
  paper: <FileText size={16} />,
  pdf: <FileText size={16} />,
  book: <Book size={16} />,
  documentation: <Code size={16} />,
  video: <Video size={16} />,
  article: <Globe size={16} />
};

export const ResourceLibraryModal: React.FC<ResourceLibraryModalProps> = ({
  isOpen,
  onClose,
  resources,
  subjects,
  topics,
  selectedSubjectId,
  selectedTopicId,
  onCreateResource,
  onUpdateStatus,
  onDeleteResource,
  onStudyResource,
  onSynthesizeNote
}) => {
  const [filterSubjectId, setFilterSubjectId] = useState<string>(selectedSubjectId || 'all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Creation form state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<ResourceType>('paper');
  const [newSubjectId, setNewSubjectId] = useState<string>(selectedSubjectId || subjects[0]?.id || '');
  const [newTopicId, setNewTopicId] = useState<string>(selectedTopicId || '');
  const [newNotes, setNewNotes] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subjectTopics = useMemo(() => {
    return topics.filter((t) => !newSubjectId || t.subjectId === newSubjectId);
  }, [topics, newSubjectId]);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (filterSubjectId !== 'all' && r.subjectId !== filterSubjectId) return false;
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchAuthor = r.author?.toLowerCase().includes(q);
        const matchTag = r.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchAuthor && !matchTag) return false;
      }
      return true;
    });
  }, [resources, filterSubjectId, filterType, filterStatus, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSubjectId) return;

    setIsSubmitting(true);
    try {
      const tags = newTagsStr
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await onCreateResource({
        title: newTitle.trim(),
        author: newAuthor.trim() || undefined,
        url: newUrl.trim() || undefined,
        type: newType,
        subjectId: newSubjectId,
        topicId: newTopicId || undefined,
        status: 'unread',
        notes: newNotes.trim() || undefined,
        tags
      });

      setNewTitle('');
      setNewAuthor('');
      setNewUrl('');
      setNewNotes('');
      setNewTagsStr('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create resource:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Knowledge Library & Research Citations"
      className="solis-resource-library-dialog"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Header Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '2 1 200px', position: 'relative' }}>
            <Input
              placeholder="Search papers, textbooks, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <CustomSelect
              value={filterSubjectId}
              onChange={setFilterSubjectId}
              options={[
                { value: 'all', label: 'All Subjects' },
                ...subjects.map((s) => ({ value: s.id, label: s.name }))
              ]}
            />
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <CustomSelect
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'paper', label: 'Research Paper' },
                { value: 'book', label: 'Textbook' },
                { value: 'documentation', label: 'Documentation' },
                { value: 'video', label: 'Video Lecture' },
                { value: 'article', label: 'Article' }
              ]}
            />
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <CustomSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'unread', label: 'Unread' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' }
              ]}
            />
          </div>
        </div>

        {/* Create Resource Form Drawer */}
        {isCreating ? (
          <form
            onSubmit={handleCreate}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'var(--bg-surface-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
                Catalog New Study Resource
              </span>
            </div>

            <Input
              label="Resource Title"
              placeholder="e.g. In Search of an Understandable Consensus Algorithm"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              autoFocus
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <Input
                label="Author / Institution"
                placeholder="e.g. Diego Ongaro (Stanford)"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
              />
              <Input
                label="URL / Document Link"
                placeholder="https://raft.github.io/raft.pdf"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              <CustomSelect
                label="Resource Type"
                value={newType}
                onChange={(val) => setNewType(val as ResourceType)}
                options={[
                  { value: 'paper', label: 'Research Paper' },
                  { value: 'book', label: 'Textbook / Chapter' },
                  { value: 'documentation', label: 'Documentation' },
                  { value: 'video', label: 'Video Lecture' },
                  { value: 'article', label: 'Article / Post' },
                  { value: 'pdf', label: 'PDF Reference' }
                ]}
              />

              <CustomSelect
                label="Associated Subject"
                value={newSubjectId}
                onChange={(val) => {
                  setNewSubjectId(val);
                  setNewTopicId('');
                }}
                options={subjects.map((s) => ({ value: s.id, label: s.name }))}
              />

              <CustomSelect
                label="Syllabus Topic"
                value={newTopicId}
                onChange={setNewTopicId}
                options={[
                  { value: '', label: 'General Reference' },
                  ...subjectTopics.map((t) => ({ value: t.id, label: t.title }))
                ]}
              />
            </div>

            <Textarea
              label="Annotation & Synthesis Notes"
              placeholder="Key proofs, core invariants, or motivation to read..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              style={{ minHeight: '68px' }}
            />

            <Input
              label="Tags (comma-separated)"
              placeholder="consensus, raft, stanford, proof"
              value={newTagsStr}
              onChange={(e) => setNewTagsStr(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting} leftIcon={<Plus size={14} />}>
                Catalog Resource
              </Button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              Showing {filteredResources.length} of {resources.length} study references
            </span>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setIsCreating(true)}
            >
              + Catalog Reference
            </Button>
          </div>
        )}

        {/* Resources Grid */}
        {filteredResources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
            <Bookmark size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
            <p>No study resources found matching the active filters.</p>
          </div>
        ) : (
          <div className="solis-resource-grid">
            {filteredResources.map((res) => (
              <div
                key={res.id}
                className={`solis-resource-card ${res.status === 'completed' ? 'solis-resource-card--completed' : ''}`}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="solis-resource-type-icon">{TYPE_ICONS[res.type] || <FileText size={16} />}</div>
                      <Badge variant={res.status === 'completed' ? 'sage' : res.status === 'in_progress' ? 'amber' : 'neutral'}>
                        {res.status === 'in_progress' ? 'In Progress' : res.status === 'completed' ? 'Completed' : 'Unread'}
                      </Badge>
                    </div>

                    <button
                      onClick={() => onDeleteResource(res.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      title="Delete reference"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-body-md)', fontWeight: 600, margin: '0 0 4px 0', lineHeight: 1.3 }}>
                    {res.title}
                  </h4>

                  {res.author && (
                    <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      By {res.author}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {res.subjectName && <Badge variant="neutral">{res.subjectName}</Badge>}
                    {res.topicTitle && <Badge variant="lavender">{res.topicTitle}</Badge>}
                  </div>

                  {res.notes && (
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      {res.notes}
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  {/* Status Toggle Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const nextStatus: ReadingStatus =
                        res.status === 'unread'
                          ? 'in_progress'
                          : res.status === 'in_progress'
                          ? 'completed'
                          : 'unread';
                      onUpdateStatus(res.id, nextStatus);
                    }}
                  >
                    {res.status === 'completed' ? 'Mark Unread' : res.status === 'in_progress' ? 'Complete' : 'Start Reading'}
                  </Button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {res.url && (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '6px',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--color-coral-500)',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title="Open Resource Link"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSynthesizeNote(res)}
                      title="Synthesize into Note"
                    >
                      <FileEdit size={14} />
                    </Button>

                    <Button
                      variant="subtle"
                      size="sm"
                      leftIcon={<Play size={12} />}
                      onClick={() => onStudyResource(res)}
                    >
                      Study
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
