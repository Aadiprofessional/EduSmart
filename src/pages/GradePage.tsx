import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertTriangle,
  FiAward,
  FiBarChart2,
  FiBook,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFileText,
  FiFolder,
  FiFolderPlus,
  FiLoader,
  FiMessageSquare,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiTrash2,
  FiTrendingUp,
  FiUpload,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css';
import SidebarLeft from '../components/dashboard/SidebarLeft';
import { getApiBaseUrl } from '../config/api';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';
import coinIcon from '../assets/assets_coin.png';

type TabKey = 'kb' | 'submissions' | 'results';

type BannerState = {
  type: 'success' | 'error' | 'info';
  text: string;
} | null;

type FolderItem = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  docsCount: number;
  submissionsCount: number;
  resultsCount: number;
};

type FolderDetail = {
  id: string;
  name: string;
  description: string;
  docs: KnowledgeDoc[];
};

type KnowledgeDoc = {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  fileUrl: string;
};

type SubmissionItem = {
  id: string;
  studentName: string;
  fileName: string;
  status: string;
  createdAt: string;
  resultId: string;
  fileUrl: string;
};

type QuestionBreakdownItem = {
  question: string;
  score: number;
  maxScore: number;
  feedback: string;
};

type ResultItem = {
  id: string;
  submissionId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  questionBreakdown: QuestionBreakdownItem[];
  createdAt: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

type ChatModalState = {
  open: boolean;
  resultId: string;
  studentName: string;
};

const PAPER_GRADER_BASE = `${getApiBaseUrl()}/api/paper-grader`;
const READY_LIKE_STATUSES = new Set(['ready', 'processed', 'completed', 'done', 'graded']);
const FAILED_LIKE_STATUSES = new Set(['failed', 'error']);

const toNumber = (value: unknown, fallback = 0): number => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const toStringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return fallback;
};

const asArray = (value: unknown): any[] => {
  return Array.isArray(value) ? value : [];
};

const pickArray = (payload: any, keys: string[]): any[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.data?.[key])) {
      return payload.data[key];
    }
  }

  return [];
};

const pickObject = (payload: any, keys: string[]): any => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    for (const key of keys) {
      if (payload[key] && typeof payload[key] === 'object') {
        return payload[key];
      }
    }
  }

  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    for (const key of keys) {
      if (payload.data[key] && typeof payload.data[key] === 'object') {
        return payload.data[key];
      }
    }
    return payload.data;
  }

  return payload;
};

const splitStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => toStringValue(item)).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeFolder = (item: any): FolderItem => {
  return {
    id: toStringValue(item?.id ?? item?.folder_id ?? item?.uuid),
    name: toStringValue(item?.name ?? item?.title, 'Untitled Folder'),
    description: toStringValue(item?.description),
    createdAt: toStringValue(item?.created_at ?? item?.createdAt),
    docsCount: toNumber(item?.docs_count ?? item?.doc_count ?? item?.documents_count),
    submissionsCount: toNumber(item?.submissions_count ?? item?.submission_count),
    resultsCount: toNumber(item?.results_count ?? item?.result_count),
  };
};

const normalizeDoc = (item: any): KnowledgeDoc => {
  return {
    id: toStringValue(item?.id ?? item?.doc_id ?? item?.uuid),
    fileName: toStringValue(item?.file_name ?? item?.filename ?? item?.name, 'Unnamed Document'),
    status: toStringValue(item?.status ?? item?.processing_status, 'processing'),
    createdAt: toStringValue(item?.created_at ?? item?.createdAt),
    fileUrl: toStringValue(item?.file_url ?? item?.url ?? item?.public_url),
  };
};

const normalizeSubmission = (item: any): SubmissionItem => {
  // paper_grader_results is an embedded array from the submissions endpoint
  const embeddedResultId = toStringValue(
    item?.paper_grader_results?.[0]?.id ?? item?.result_id ?? item?.resultId,
  );
  return {
    id: toStringValue(item?.id ?? item?.submission_id ?? item?.uuid),
    studentName: toStringValue(item?.student_name ?? item?.studentName, 'Unknown Student'),
    fileName: toStringValue(item?.file_name ?? item?.filename ?? item?.name, 'Unnamed Submission'),
    status: toStringValue(item?.status, 'processing'),
    createdAt: toStringValue(item?.created_at ?? item?.createdAt),
    resultId: embeddedResultId,
    fileUrl: toStringValue(item?.file_url ?? item?.url ?? item?.public_url),
  };
};

const normalizeQuestionBreakdown = (items: any[]): QuestionBreakdownItem[] => {
  return items.map((item, index) => {
    return {
      question: toStringValue(
        item?.question_number
          ? `${item.question_number}: ${item?.question_text ?? ''}`
          : (item?.question ?? item?.question_text ?? item?.question_no ?? item?.title),
        `Question ${index + 1}`,
      ),
      score: toNumber(item?.marks_awarded ?? item?.score ?? item?.marks_obtained),
      maxScore: toNumber(item?.marks_possible ?? item?.max_score ?? item?.max_marks ?? item?.total, 0),
      feedback: toStringValue(item?.feedback ?? item?.remark),
    };
  });
};

const normalizeResult = (item: any): ResultItem => {
  const score = toNumber(item?.marks_awarded ?? item?.score ?? item?.obtained_marks ?? item?.marks_obtained);
  const totalMarks = toNumber(item?.total_marks ?? item?.totalMarks ?? item?.max_marks, 100);
  const percentageFromServer = toNumber(item?.percentage ?? item?.percent ?? item?.score_percent, NaN);
  const computedPercentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
  const percentage = Number.isNaN(percentageFromServer) ? computedPercentage : percentageFromServer;

  return {
    id: toStringValue(item?.id ?? item?.result_id ?? item?.uuid),
    submissionId: toStringValue(item?.submission_id ?? item?.submissionId),
    studentName: toStringValue(item?.student_name ?? item?.studentName, 'Unknown Student'),
    score,
    totalMarks,
    percentage,
    grade: toStringValue(item?.grade),
    feedback: toStringValue(item?.feedback ?? item?.overall_feedback ?? item?.summary),
    strengths: splitStringList(item?.strengths),
    weaknesses: splitStringList(item?.weaknesses),
    questionBreakdown: normalizeQuestionBreakdown(
      asArray(item?.question_breakdown ?? item?.questionBreakdown ?? item?.questions),
    ),
    createdAt: toStringValue(item?.created_at ?? item?.createdAt),
  };
};

const formatDate = (rawDate: string): string => {
  if (!rawDate) {
    return 'Just now';
  }
  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return rawDate;
  }
  return parsedDate.toLocaleString();
};

const formatPercent = (value: number): string => `${Math.max(0, Math.min(100, value)).toFixed(1)}%`;

const toStatusTone = (status: string): string => {
  const normalized = status.toLowerCase();
  if (READY_LIKE_STATUSES.has(normalized)) {
    return 'ready';
  }
  if (FAILED_LIKE_STATUSES.has(normalized)) {
    return 'failed';
  }
  return 'processing';
};

type ApiMethod = 'GET' | 'POST' | 'DELETE';

type FilePreviewType = 'pdf' | 'image' | 'office' | 'other';

type PreviewModalState = {
  open: boolean;
  title: string;
  fileName: string;
  fileUrl: string;
  type: FilePreviewType;
};

const getFilePreviewType = (name: string, url: string): FilePreviewType => {
  const target = `${name} ${url}`.toLowerCase();

  if (target.includes('.pdf')) {
    return 'pdf';
  }

  if (/(\.png|\.jpg|\.jpeg|\.webp|\.gif|\.bmp|\.svg)/.test(target)) {
    return 'image';
  }

  if (/(\.doc|\.docx|\.ppt|\.pptx|\.xls|\.xlsx|\.csv|\.txt)/.test(target)) {
    return 'office';
  }

  return 'other';
};

const GradePage: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const { t, formatDateTime } = useLanguage();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [folderDetail, setFolderDetail] = useState<FolderDetail | null>(null);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string>('');
  const [selectedResultDetail, setSelectedResultDetail] = useState<ResultItem | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('kb');

  const [folderSearch, setFolderSearch] = useState<string>('');
  const [submissionSearch, setSubmissionSearch] = useState<string>('');

  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderDescription, setNewFolderDescription] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [totalMarksBySubmission, setTotalMarksBySubmission] = useState<Record<string, number>>({});

  const [loadingFolders, setLoadingFolders] = useState<boolean>(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState<boolean>(false);
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const [uploadingSubmission, setUploadingSubmission] = useState<boolean>(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string>('');
  const [banner, setBanner] = useState<BannerState>(null);
  const [showSubmissionUploadModal, setShowSubmissionUploadModal] = useState<boolean>(false);
  const [uploadModalStudentName, setUploadModalStudentName] = useState<string>('');
  const [uploadModalFile, setUploadModalFile] = useState<File | null>(null);
  const [showSubmissionReportModal, setShowSubmissionReportModal] = useState<boolean>(false);
  const [previewModal, setPreviewModal] = useState<PreviewModalState>({
    open: false,
    title: '',
    fileName: '',
    fileUrl: '',
    type: 'other',
  });

  // Chat state
  const [chatModal, setChatModal] = useState<ChatModalState>({ open: false, resultId: '', studentName: '' });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatStreaming, setChatStreaming] = useState<boolean>(false);
  const [clearingChat, setClearingChat] = useState<boolean>(false);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

  const bannerTimerRef = useRef<number | null>(null);
  const kbInputRef = useRef<HTMLInputElement | null>(null);

  const token = session?.access_token || '';

  const formatDateLabel = useCallback(
    (rawDate: string): string => {
      if (!rawDate) {
        return t('gradePage.studio.justNow');
      }
      const parsedDate = new Date(rawDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return rawDate;
      }
      return formatDateTime(parsedDate, { dateStyle: 'medium', timeStyle: 'short' });
    },
    [formatDateTime, t],
  );

  const notify = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setBanner({ type, text });
    if (bannerTimerRef.current) {
      window.clearTimeout(bannerTimerRef.current);
    }
    bannerTimerRef.current = window.setTimeout(() => {
      setBanner(null);
    }, 3600);
  }, []);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        window.clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  const apiRequest = useCallback(
    async <T,>(path: string, method: ApiMethod, body?: unknown, isFormData = false): Promise<T> => {
      if (!token) {
        throw new Error('Please sign in again to use paper grading.');
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      let finalBody: BodyInit | undefined;
      if (body instanceof FormData) {
        finalBody = body;
      } else if (body !== undefined) {
        if (!isFormData) {
          headers['Content-Type'] = 'application/json';
        }
        finalBody = isFormData ? (body as BodyInit) : JSON.stringify(body);
      }

      const response = await fetch(`${PAPER_GRADER_BASE}${path}`, {
        method,
        headers,
        body: finalBody,
      });

      const rawText = await response.text();
      let payload: any = null;
      if (rawText) {
        try {
          payload = JSON.parse(rawText);
        } catch {
          payload = { message: rawText };
        }
      }

      if (!response.ok) {
        const message =
          toStringValue(payload?.message) ||
          toStringValue(payload?.error) ||
          `Request failed (${response.status})`;
        throw new Error(message);
      }

      return payload as T;
    },
    [token],
  );

  const loadFolders = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoadingFolders(true);
    try {
      const response = await apiRequest<any>('/folders', 'GET');
      const fetchedFolders = pickArray(response, ['folders', 'items', 'data'])
        .map(normalizeFolder)
        .filter((folder) => folder.id);

      setFolders(fetchedFolders);
      setSelectedFolderId((currentSelectedId) => {
        if (currentSelectedId && fetchedFolders.some((folder) => folder.id === currentSelectedId)) {
          return currentSelectedId;
        }
        return fetchedFolders[0]?.id || '';
      });
    } catch (error: any) {
      notify('error', error?.message || 'Unable to load folders.');
    } finally {
      setLoadingFolders(false);
    }
  }, [apiRequest, notify, token]);

  const loadFolderWorkspace = useCallback(
    async (folderId: string) => {
      if (!folderId) {
        return;
      }

      setLoadingWorkspace(true);
      try {
        const [folderResponse, submissionsResponse, resultsResponse] = await Promise.all([
          apiRequest<any>(`/folders/${folderId}`, 'GET'),
          apiRequest<any>(`/folders/${folderId}/submissions`, 'GET'),
          apiRequest<any>(`/folders/${folderId}/results`, 'GET'),
        ]);

        // GET /folders/:id returns { folder: {...}, docs: [...] } — docs at root, not inside folder
        const folderObject = pickObject(folderResponse, ['folder', 'data']);
        const normalizedDocs = pickArray(folderResponse, ['docs', 'documents', 'kb_docs'])
          .map(normalizeDoc)
          .filter((doc) => doc.id);

        setFolderDetail({
          id: toStringValue(folderObject?.id ?? folderId),
          name: toStringValue(folderObject?.name, 'Folder'),
          description: toStringValue(folderObject?.description),
          docs: normalizedDocs,
        });
        setDocs(normalizedDocs);

        const normalizedSubmissions = pickArray(submissionsResponse, ['submissions', 'items', 'data'])
          .map(normalizeSubmission)
          .filter((submission) => submission.id);
        setSubmissions(normalizedSubmissions);

        const normalizedResults = pickArray(resultsResponse, ['results', 'items', 'data'])
          .map(normalizeResult)
          .filter((result) => result.id);
        setResults(normalizedResults);

        setSelectedResultId((currentResultId) => {
          if (currentResultId && normalizedResults.some((result) => result.id === currentResultId)) {
            return currentResultId;
          }
          return normalizedResults[0]?.id || '';
        });
      } catch (error: any) {
        notify('error', error?.message || 'Unable to load folder workspace.');
      } finally {
        setLoadingWorkspace(false);
      }
    },
    [apiRequest, notify],
  );

  const loadResultDetail = useCallback(
    async (resultId: string) => {
      if (!resultId) {
        setSelectedResultDetail(null);
        return;
      }

      try {
        const response = await apiRequest<any>(`/results/${resultId}`, 'GET');
        const resultObject = pickObject(response, ['result', 'data']);
        setSelectedResultDetail(normalizeResult(resultObject));
      } catch (error: any) {
        notify('error', error?.message || 'Unable to load result details.');
      }
    },
    [apiRequest, notify],
  );

  useEffect(() => {
    if (!authLoading && token) {
      void loadFolders();
    }
  }, [authLoading, loadFolders, token]);

  useEffect(() => {
    if (selectedFolderId) {
      void loadFolderWorkspace(selectedFolderId);
      return;
    }
    setFolderDetail(null);
    setDocs([]);
    setSubmissions([]);
    setResults([]);
    setSelectedResultDetail(null);
  }, [loadFolderWorkspace, selectedFolderId]);

  useEffect(() => {
    if (selectedResultId) {
      void loadResultDetail(selectedResultId);
      return;
    }
    setSelectedResultDetail(null);
  }, [loadResultDetail, selectedResultId]);

  const hasPendingProcessing = useMemo(() => {
    const pendingDocs = docs.some((doc) => {
      const tone = toStatusTone(doc.status);
      return tone === 'processing';
    });
    const pendingSubmissions = submissions.some((submission) => {
      const tone = toStatusTone(submission.status);
      return tone === 'processing';
    });
    return pendingDocs || pendingSubmissions;
  }, [docs, submissions]);

  useEffect(() => {
    if (!selectedFolderId || !hasPendingProcessing) {
      return;
    }
    const interval = window.setInterval(() => {
      void loadFolderWorkspace(selectedFolderId);
    }, 7000);
    return () => {
      window.clearInterval(interval);
    };
  }, [hasPendingProcessing, loadFolderWorkspace, selectedFolderId]);

  const filteredFolders = useMemo(() => {
    const query = folderSearch.trim().toLowerCase();
    if (!query) {
      return folders;
    }
    return folders.filter((folder) => {
      return (
        folder.name.toLowerCase().includes(query) ||
        folder.description.toLowerCase().includes(query)
      );
    });
  }, [folderSearch, folders]);

  const filteredSubmissions = useMemo(() => {
    const query = submissionSearch.trim().toLowerCase();
    if (!query) {
      return submissions;
    }
    return submissions.filter((submission) => {
      return (
        submission.studentName.toLowerCase().includes(query) ||
        submission.fileName.toLowerCase().includes(query)
      );
    });
  }, [submissionSearch, submissions]);

  const analytics = useMemo(() => {
    if (!results.length) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        passRate: 0,
      };
    }

    const percentages = results.map((result) => result.percentage);
    const total = percentages.reduce((sum, score) => sum + score, 0);
    const passed = percentages.filter((score) => score >= 40).length;

    return {
      average: total / results.length,
      highest: Math.max(...percentages),
      lowest: Math.min(...percentages),
      passRate: (passed / results.length) * 100,
    };
  }, [results]);

  const resultsTrendPoints = useMemo(() => {
    const sortedResults = [...results].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    if (!sortedResults.length) {
      return '';
    }

    return sortedResults
      .map((result, index) => {
        const x = sortedResults.length <= 1 ? 8 : (index / (sortedResults.length - 1)) * 92 + 4;
        const clamped = Math.max(0, Math.min(100, result.percentage));
        const y = 96 - clamped * 0.88;
        return `${x},${y}`;
      })
      .join(' ');
  }, [results]);

  const selectedFolder = useMemo(() => {
    return folders.find((folder) => folder.id === selectedFolderId) || null;
  }, [folders, selectedFolderId]);

  const selectedResultFromList = useMemo(() => {
    return results.find((result) => result.id === selectedResultId) || null;
  }, [results, selectedResultId]);

  const createFolder = useCallback(async () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) {
      notify('error', 'Folder name is required.');
      return;
    }

    setCreatingFolder(true);
    try {
      const response = await apiRequest<any>('/folders', 'POST', {
        name: trimmedName,
        description: newFolderDescription.trim(),
      });

      const folderObject = pickObject(response, ['folder', 'data']);
      const createdFolder = normalizeFolder(folderObject);

      setNewFolderName('');
      setNewFolderDescription('');
      notify('success', t('gradePage.studio.messages.folderCreated'));
      await loadFolders();

      if (createdFolder.id) {
        setSelectedFolderId(createdFolder.id);
      }
    } catch (error: any) {
      notify('error', error?.message || 'Unable to create folder.');
    } finally {
      setCreatingFolder(false);
    }
  }, [apiRequest, loadFolders, newFolderDescription, newFolderName, notify, t]);

  const deleteFolder = useCallback(
    async (folderId: string) => {
      const targetFolder = folders.find((folder) => folder.id === folderId);
      const confirmed = window.confirm(
        t('gradePage.studio.messages.deleteFolderConfirm', {
          values: { name: targetFolder?.name || t('gradePage.studio.thisFolder') },
        }),
      );

      if (!confirmed) {
        return;
      }

      setDeletingId(`folder-${folderId}`);
      try {
        await apiRequest(`/folders/${folderId}`, 'DELETE');
        notify('success', t('gradePage.studio.messages.folderDeleted'));
        await loadFolders();
      } catch (error: any) {
        notify('error', error?.message || 'Unable to delete folder.');
      } finally {
        setDeletingId('');
      }
    },
    [apiRequest, folders, loadFolders, notify, t],
  );

  const uploadKnowledgeDoc = useCallback(
    async (file: File) => {
      if (!selectedFolderId) {
        notify('error', t('gradePage.studio.messages.selectFolderFirst'));
        return;
      }

      if (docs.length >= 5) {
        notify('error', t('gradePage.studio.messages.maxDocsReached'));
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      setUploadingDoc(true);
      try {
        await apiRequest(`/folders/${selectedFolderId}/docs`, 'POST', formData, true);
        notify('success', t('gradePage.studio.messages.kbUploaded'));
        await loadFolderWorkspace(selectedFolderId);
      } catch (error: any) {
        notify('error', error?.message || 'Unable to upload document.');
      } finally {
        setUploadingDoc(false);
      }
    },
    [apiRequest, docs.length, loadFolderWorkspace, notify, selectedFolderId, t],
  );

  const refreshDocStatus = useCallback(
    async (docId: string) => {
      if (!selectedFolderId) {
        return;
      }

      try {
        await apiRequest(`/folders/${selectedFolderId}/docs/${docId}/status`, 'GET');
        await loadFolderWorkspace(selectedFolderId);
      } catch (error: any) {
        notify('error', error?.message || 'Unable to refresh doc status.');
      }
    },
    [apiRequest, loadFolderWorkspace, notify, selectedFolderId, t],
  );

  const deleteDoc = useCallback(
    async (docId: string) => {
      if (!selectedFolderId) {
        return;
      }

      const confirmed = window.confirm(t('gradePage.studio.messages.deleteDocConfirm'));
      if (!confirmed) {
        return;
      }

      setDeletingId(`doc-${docId}`);
      try {
        await apiRequest(`/folders/${selectedFolderId}/docs/${docId}`, 'DELETE');
        notify('success', t('gradePage.studio.messages.docDeleted'));
        await loadFolderWorkspace(selectedFolderId);
      } catch (error: any) {
        notify('error', error?.message || 'Unable to delete document.');
      } finally {
        setDeletingId('');
      }
    },
    [apiRequest, loadFolderWorkspace, notify, selectedFolderId, t],
  );

  const uploadSubmission = useCallback(
    async (file: File, providedStudentName?: string) => {
      if (!selectedFolderId) {
        notify('error', t('gradePage.studio.messages.selectFolderFirst'));
        return;
      }

      const cleanStudentName = (providedStudentName ?? studentName).trim();
      if (!cleanStudentName) {
        notify('error', t('gradePage.studio.messages.studentNameRequired'));
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('student_name', cleanStudentName);

      setUploadingSubmission(true);
      try {
        await apiRequest(`/folders/${selectedFolderId}/submissions`, 'POST', formData, true);
        notify('success', t('gradePage.studio.messages.submissionUploaded'));
        setStudentName('');
        setUploadModalStudentName('');
        setUploadModalFile(null);
        setShowSubmissionUploadModal(false);
        await loadFolderWorkspace(selectedFolderId);
      } catch (error: any) {
        notify('error', error?.message || 'Unable to upload submission.');
      } finally {
        setUploadingSubmission(false);
      }
    },
    [apiRequest, loadFolderWorkspace, notify, selectedFolderId, studentName, t],
  );

  const refreshSubmissionStatus = useCallback(
    async (submissionId: string) => {
      if (!selectedFolderId) {
        return;
      }

      try {
        await apiRequest(`/folders/${selectedFolderId}/submissions/${submissionId}/status`, 'GET');
        await loadFolderWorkspace(selectedFolderId);
      } catch (error: any) {
        notify('error', error?.message || 'Unable to refresh submission status.');
      }
    },
    [apiRequest, loadFolderWorkspace, notify, selectedFolderId],
  );

  const deleteSubmission = useCallback(
    async (submissionId: string) => {
      if (!selectedFolderId) {
        return;
      }

      const confirmed = window.confirm(t('gradePage.studio.messages.deleteSubmissionConfirm'));
      if (!confirmed) {
        return;
      }

      setDeletingId(`submission-${submissionId}`);
      try {
        await apiRequest(`/folders/${selectedFolderId}/submissions/${submissionId}`, 'DELETE');
        notify('success', t('gradePage.studio.messages.submissionDeleted'));
        await loadFolderWorkspace(selectedFolderId);
      } catch (error: any) {
        notify('error', error?.message || 'Unable to delete submission.');
      } finally {
        setDeletingId('');
      }
    },
    [apiRequest, loadFolderWorkspace, notify, selectedFolderId],
  );

  const gradeSubmission = useCallback(
    async (submission: SubmissionItem) => {
      if (!selectedFolderId) {
        return;
      }

      const marks = totalMarksBySubmission[submission.id] || 100;
      if (!Number.isFinite(marks) || marks <= 0) {
        notify('error', t('gradePage.studio.messages.totalMarksPositive'));
        return;
      }

      setGradingSubmissionId(submission.id);
      try {
        await apiRequest(`/folders/${selectedFolderId}/submissions/${submission.id}/grade`, 'POST', {
          total_marks: marks,
        });
        notify('success', t('gradePage.studio.messages.gradingCompleted'));
        setActiveTab('submissions');
        await loadFolderWorkspace(selectedFolderId);
      } catch (error: any) {
        notify('error', error?.message || 'Unable to grade submission.');
      } finally {
        setGradingSubmissionId('');
      }
    },
    [apiRequest, loadFolderWorkspace, notify, selectedFolderId, t, totalMarksBySubmission],
  );

  const deleteResult = useCallback(
    async (resultId: string) => {
      const confirmed = window.confirm(t('gradePage.studio.messages.deleteResultConfirm'));
      if (!confirmed) {
        return;
      }

      setDeletingId(`result-${resultId}`);
      try {
        await apiRequest(`/results/${resultId}`, 'DELETE');
        notify('success', t('gradePage.studio.messages.resultDeleted'));
        if (selectedFolderId) {
          await loadFolderWorkspace(selectedFolderId);
        }
      } catch (error: any) {
        notify('error', error?.message || 'Unable to delete result.');
      } finally {
        setDeletingId('');
      }
    },
    [apiRequest, loadFolderWorkspace, notify, selectedFolderId, t],
  );

  const handleKbInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void uploadKnowledgeDoc(file);
    }
    event.target.value = '';
  };

  // ── Chat feature ──────────────────────────────────────────────────────────

  const openChatModal = useCallback(
    async (resultId: string, studentName: string) => {
      setChatModal({ open: true, resultId, studentName });
      setChatMessages([]);
      setChatInput('');
      setChatLoading(true);
      try {
        const response = await apiRequest<any>(`/results/${resultId}/chat`, 'GET');
        const rawMessages: any[] = Array.isArray(response?.messages)
          ? response.messages
          : Array.isArray(response)
          ? response
          : [];
        setChatMessages(
          rawMessages.map((m: any) => ({
            id: toStringValue(m?.id ?? m?.message_id, String(Math.random())),
            role: m?.role === 'user' ? 'user' : 'assistant',
            content: toStringValue(m?.content),
            createdAt: toStringValue(m?.created_at ?? m?.createdAt),
          })),
        );
      } catch {
        // no prior messages — that's fine
      } finally {
        setChatLoading(false);
      }
    },
    [apiRequest],
  );

  const closeChatModal = useCallback(() => {
    setChatModal({ open: false, resultId: '', studentName: '' });
    setChatMessages([]);
    setChatInput('');
  }, []);

  // Auto-scroll chat to bottom whenever messages change
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChatMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatStreaming || !chatModal.resultId) {
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const assistantPlaceholderId = `ai-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setChatInput('');
    setChatStreaming(true);

    try {
      const response = await fetch(`${PAPER_GRADER_BASE}/results/${chatModal.resultId}/chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let aiContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]' || trimmed === '[DONE]') {
            continue;
          }
          if (trimmed.startsWith('[ERROR]') || trimmed.startsWith('data: [ERROR]')) {
            const errMsg = trimmed.replace(/^data:\s*/, '').replace('[ERROR]', '').trim();
            setChatMessages((prev) =>
              prev.filter((m) => m.id !== assistantPlaceholderId),
            );
            notify('error', errMsg || 'Chat error — please try again.');
            return;
          }
          let jsonStr = trimmed.startsWith('data: ') ? trimmed.slice(6).trim() : trimmed;
          if (!jsonStr || jsonStr === '[DONE]') {
            continue;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = typeof parsed?.content === 'string' ? parsed.content : '';
            if (chunk) {
              aiContent += chunk;
              setChatMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantPlaceholderId ? { ...m, content: aiContent } : m,
                ),
              );
            }
          } catch {
            // non-JSON line — skip
          }
        }
      }
    } catch (error: any) {
      setChatMessages((prev) => prev.filter((m) => m.id !== assistantPlaceholderId));
      notify('error', error?.message || 'Failed to send message.');
    } finally {
      setChatStreaming(false);
    }
  }, [chatInput, chatModal.resultId, chatStreaming, notify, token]);

  const clearChatHistory = useCallback(async () => {
    if (!chatModal.resultId) {
      return;
    }
    setClearingChat(true);
    try {
      await apiRequest(`/results/${chatModal.resultId}/chat`, 'DELETE');
      setChatMessages([]);
    } catch (error: any) {
      notify('error', error?.message || 'Failed to clear chat.');
    } finally {
      setClearingChat(false);
    }
  }, [apiRequest, chatModal.resultId, notify]);

  const openPreviewModal = useCallback(
    (title: string, fileName: string, fileUrl: string) => {
      if (!fileUrl) {
        notify('error', t('gradePage.studio.messages.previewUnavailable'));
        return;
      }

      setPreviewModal({
        open: true,
        title,
        fileName,
        fileUrl,
        type: getFilePreviewType(fileName, fileUrl),
      });
    },
    [notify, t],
  );

  const openSubmissionReport = useCallback(
    async (submission: SubmissionItem) => {
      const linkedResultId =
        submission.resultId ||
        results.find((result) => result.submissionId === submission.id || result.studentName === submission.studentName)?.id ||
        '';

      if (!linkedResultId) {
        notify('info', t('gradePage.studio.messages.noReportYet'));
        return;
      }

      setSelectedResultId(linkedResultId);
      setShowSubmissionReportModal(true);

      try {
        const response = await apiRequest<any>(`/results/${linkedResultId}`, 'GET');
        const resultObject = pickObject(response, ['result', 'data']);
        setSelectedResultDetail(normalizeResult(resultObject));
      } catch (error: any) {
        notify('error', error?.message || 'Unable to load result details.');
      }
    },
    [apiRequest, notify, results, t],
  );

  const handleSubmissionUploadFromModal = useCallback(() => {
    if (!uploadModalFile) {
      notify('error', t('gradePage.studio.messages.selectFileFirst'));
      return;
    }

    void uploadSubmission(uploadModalFile, uploadModalStudentName);
  }, [notify, t, uploadModalFile, uploadModalStudentName, uploadSubmission]);

  if (authLoading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-[#111111] flex items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-5 py-4 text-gray-700 dark:text-gray-200 shadow-sm">
          <FiLoader className="animate-spin" />
          {t('gradePage.studio.loadingPaperGrader')}
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-[#111111] flex items-center justify-center p-4">
        <div className="max-w-lg rounded-2xl border border-amber-200 dark:border-amber-400/20 bg-amber-50 dark:bg-amber-500/10 p-8 text-amber-900 dark:text-amber-200 shadow-sm">
          <h2 className="text-2xl font-semibold">{t('gradePage.studio.pleaseSignIn')}</h2>
          <p className="mt-2 text-sm">
            {t('gradePage.studio.signInPrompt')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white font-sans">
      <div className="flex h-full w-full">
        <SidebarLeft className="hidden lg:flex" />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-4 py-4 md:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                  {t('gradePage.studio.badge')}
                </p>
                <h1 className="mt-2 text-2xl font-bold md:text-3xl text-gray-900 dark:text-white">{t('gradePage.studio.title')}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 md:text-base">
                  {t('gradePage.studio.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <StatCard icon={<FiFolder />} label={t('gradePage.studio.stats.folders')} value={folders.length} color="indigo" />
                <StatCard icon={<FiBook />} label={t('gradePage.studio.stats.docs')} value={docs.length} color="green" />
                <StatCard icon={<FiUsers />} label={t('gradePage.studio.stats.submissions')} value={submissions.length} color="amber" />
                <StatCard icon={<FiAward />} label={t('gradePage.studio.stats.results')} value={results.length} color="red" />
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] px-3 py-2 text-gray-700 dark:text-gray-200">
                  <div className="flex items-center gap-1">
                    <img src={coinIcon} alt={t('gradePage.studio.coinsAlt')} className="h-4 w-4" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide">{t('gradePage.studio.coinCostLabel')}</p>
                  </div>
                  <p className="text-lg font-bold">{t('gradePage.studio.coinCostValue')}</p>
                </div>
              </div>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-hidden p-4 md:p-6">
            {banner && (
              <div
                className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
                  banner.type === 'success'
                    ? 'border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 text-green-800 dark:text-green-300'
                    : banner.type === 'error'
                    ? 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300'
                    : 'border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-300'
                }`}
              >
                {banner.text}
              </div>
            )}

            <div className="grid h-full min-h-0 grid-cols-1 gap-4 xl:grid-cols-12">
              <aside className="xl:col-span-4 2xl:col-span-3 min-h-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] shadow-sm">
                <div className="border-b border-gray-100 dark:border-white/10 p-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('gradePage.studio.foldersTitle')}</h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('gradePage.studio.foldersSubtitle')}</p>

                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111111] px-3 py-2">
                    <FiSearch className="text-gray-400" />
                    <input
                      type="text"
                      value={folderSearch}
                      onChange={(event) => setFolderSearch(event.target.value)}
                      placeholder={t('gradePage.studio.searchFolders')}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
                    />
                  </div>

                  <div className="mt-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111111] p-3">
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(event) => setNewFolderName(event.target.value)}
                        placeholder={t('gradePage.studio.folderNamePlaceholder')}
                        className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 py-2 text-sm outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 dark:focus:border-indigo-500/50 transition-colors"
                      />
                      <input
                        type="text"
                        value={newFolderDescription}
                        onChange={(event) => setNewFolderDescription(event.target.value)}
                        placeholder={t('gradePage.studio.descriptionPlaceholder')}
                        className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 py-2 text-sm outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 dark:focus:border-indigo-500/50 transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void createFolder();
                      }}
                      disabled={creatingFolder}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {creatingFolder ? <FiLoader className="animate-spin" /> : <FiFolderPlus />}
                      {t('gradePage.studio.createFolder')}
                    </button>
                  </div>
                </div>

                <div className="min-h-0 h-[calc(100%-220px)] overflow-y-auto p-3">
                  {loadingFolders && !folders.length && (
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111111] p-4 text-sm text-gray-500 dark:text-gray-400">
                      {t('gradePage.studio.loadingFolders')}
                    </div>
                  )}

                  {!loadingFolders && !filteredFolders.length && (
                    <EmptyState
                      icon={<FiFolderPlus />}
                      title={t('gradePage.studio.emptyFoldersTitle')}
                      subtitle={t('gradePage.studio.emptyFoldersSubtitle')}
                    />
                  )}

                  <div className="space-y-2">
                    {filteredFolders.map((folder) => {
                      const isSelected = folder.id === selectedFolderId;
                      const isDeleting = deletingId === `folder-${folder.id}`;
                      return (
                        <button
                          key={folder.id}
                          type="button"
                          onClick={() => setSelectedFolderId(folder.id)}
                          className={`w-full rounded-xl border p-3 text-left transition ${
                            isSelected
                              ? 'border-indigo-500 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10'
                              : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{folder.name}</h3>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{folder.description || t('gradePage.studio.noDescription')}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void deleteFolder(folder.id);
                              }}
                              disabled={isDeleting}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 disabled:cursor-not-allowed"
                              aria-label={t('gradePage.studio.deleteFolder')}
                            >
                              {isDeleting ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                            </button>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                            <Badge label={t('gradePage.studio.badges.docs')} value={folder.docsCount} tone="green" />
                            <Badge label={t('gradePage.studio.badges.subs')} value={folder.submissionsCount} tone="amber" />
                            <Badge label={t('gradePage.studio.badges.res')} value={folder.resultsCount} tone="red" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              <section className="xl:col-span-8 2xl:col-span-9 min-h-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] shadow-sm">
                {!selectedFolderId ? (
                  <div className="flex h-full items-center justify-center p-6">
                    <EmptyState
                      icon={<FiFolder />}
                      title={t('gradePage.studio.selectFolderTitle')}
                      subtitle={t('gradePage.studio.selectFolderSubtitle')}
                    />
                  </div>
                ) : (
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="border-b border-gray-100 dark:border-white/10 p-4 md:p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{folderDetail?.name || selectedFolder?.name || 'Folder'}</h2>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {folderDetail?.description || selectedFolder?.description || t('gradePage.studio.noDescriptionProvided')}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void loadFolderWorkspace(selectedFolderId);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-white/5"
                          >
                            <FiRefreshCw />
                            {t('common.refresh')}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              void deleteFolder(selectedFolderId);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-500/20 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <FiTrash2 />
                            {t('gradePage.studio.deleteFolder')}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <TabButton
                          title={t('gradePage.studio.tabs.kbTitle')}
                          subtitle={t('gradePage.studio.tabs.kbSubtitle')}
                          active={activeTab === 'kb'}
                          icon={<FiBook />}
                          onClick={() => setActiveTab('kb')}
                        />
                        <TabButton
                          title={t('gradePage.studio.tabs.submissionsTitle')}
                          subtitle={t('gradePage.studio.tabs.submissionsSubtitle')}
                          active={activeTab === 'submissions'}
                          icon={<FiUsers />}
                          onClick={() => setActiveTab('submissions')}
                        />
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
                      {loadingWorkspace ? (
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111111] p-6 text-sm text-gray-500 dark:text-gray-400">
                          {t('gradePage.studio.loadingWorkspace')}
                        </div>
                      ) : (
                        <>
                          {activeTab === 'kb' && (
                            <div className="space-y-4">
                              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111111] p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  <div>
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('gradePage.studio.kbTitle')}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {t('gradePage.studio.kbSubtitle')}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => kbInputRef.current?.click()}
                                    disabled={uploadingDoc || docs.length >= 5}
                                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {uploadingDoc ? <FiLoader className="animate-spin" /> : <FiUpload />}
                                    {t('gradePage.studio.uploadKbDoc')}
                                  </button>
                                </div>
                                <input
                                  ref={kbInputRef}
                                  type="file"
                                  className="hidden"
                                  onChange={handleKbInputChange}
                                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                                />
                              </div>

                              {!docs.length ? (
                                <EmptyState
                                  icon={<FiFileText />}
                                  title={t('gradePage.studio.emptyKbTitle')}
                                  subtitle={t('gradePage.studio.emptyKbSubtitle')}
                                />
                              ) : (
                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                  {docs.map((doc) => {
                                    const statusTone = toStatusTone(doc.status);
                                    const isDeletingDoc = deletingId === `doc-${doc.id}`;
                                    return (
                                      <div
                                        key={doc.id}
                                        className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] p-4"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <h4 className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{doc.fileName}</h4>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('gradePage.studio.uploadedAt', { values: { date: formatDateLabel(doc.createdAt) } })}</p>
                                          </div>
                                          <StatusPill status={doc.status} tone={statusTone} />
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              void refreshDocStatus(doc.id);
                                            }}
                                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-white/5"
                                          >
                                            <FiRefreshCw />
                                            {t('gradePage.studio.status')}
                                          </button>

                                          {doc.fileUrl ? (
                                            <button
                                              type="button"
                                              onClick={() => openPreviewModal(t('gradePage.studio.previewModal.kbPreviewTitle'), doc.fileName, doc.fileUrl)}
                                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-white/5"
                                            >
                                              <FiEye />
                                              {t('common.view')}
                                            </button>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 px-2.5 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                                              <FiEye />
                                              {t('gradePage.studio.previewUnavailable')}
                                            </span>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() => {
                                              void deleteDoc(doc.id);
                                            }}
                                            disabled={isDeletingDoc}
                                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-500/20 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10 disabled:cursor-not-allowed"
                                          >
                                            {isDeletingDoc ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                                            {t('common.delete')}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'submissions' && (
                            <div className="space-y-4">
                              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111111] p-4">
                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
                                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 py-2 sm:w-72">
                                    <FiSearch className="text-gray-400" />
                                    <input
                                      type="text"
                                      value={submissionSearch}
                                      onChange={(event) => setSubmissionSearch(event.target.value)}
                                      placeholder={t('gradePage.studio.searchSubmissions')}
                                      className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setShowSubmissionUploadModal(true)}
                                    disabled={uploadingSubmission}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {uploadingSubmission ? <FiLoader className="animate-spin" /> : <FiUpload />}
                                    {t('gradePage.studio.uploadAnswerSheet')}
                                  </button>
                                </div>
                              </div>

                              {!filteredSubmissions.length ? (
                                <EmptyState
                                  icon={<FiUsers />}
                                  title={t('gradePage.studio.emptySubmissionsTitle')}
                                  subtitle={t('gradePage.studio.emptySubmissionsSubtitle')}
                                />
                              ) : (
                                <div className="space-y-3">
                                  {filteredSubmissions.map((submission) => {
                                    const statusTone = toStatusTone(submission.status);
                                    const canGrade = statusTone === 'ready' || submission.status.toLowerCase() === 'ready';
                                    const gradingNow = gradingSubmissionId === submission.id;
                                    const deletingNow = deletingId === `submission-${submission.id}`;
                                    const marks = totalMarksBySubmission[submission.id] || 100;

                                    return (
                                      <div
                                        key={submission.id}
                                        className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] p-4"
                                      >
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                          <div className="min-w-0">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                void openSubmissionReport(submission);
                                              }}
                                              className="truncate text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline underline-offset-2"
                                            >
                                              {submission.studentName}
                                            </button>
                                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{submission.fileName}</p>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('gradePage.studio.uploadedAt', { values: { date: formatDateLabel(submission.createdAt) } })}</p>
                                          </div>

                                          <div className="flex flex-wrap items-center gap-2">
                                            <StatusPill status={submission.status} tone={statusTone} />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                void refreshSubmissionStatus(submission.id);
                                              }}
                                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-white/5"
                                            >
                                              <FiRefreshCw />
                                              {t('gradePage.studio.status')}
                                            </button>

                                            {submission.fileUrl && (
                                              <button
                                                type="button"
                                                onClick={() => openPreviewModal(t('gradePage.studio.previewModal.submissionPreviewTitle'), submission.fileName, submission.fileUrl)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-white/5"
                                              >
                                                <FiEye />
                                                {t('common.view')}
                                              </button>
                                            )}
                                          </div>
                                        </div>

                                        <div className="mt-4 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                                          <div className="flex items-center gap-2">
                                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('gradePage.studio.totalMarks')}</label>
                                            <input
                                              type="number"
                                              value={marks}
                                              min={1}
                                              onChange={(event) => {
                                                const value = Number(event.target.value);
                                                setTotalMarksBySubmission((current) => ({
                                                  ...current,
                                                  [submission.id]: Number.isFinite(value) ? value : 100,
                                                }));
                                              }}
                                              className="w-24 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-2.5 py-1.5 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 transition-colors"
                                            />
                                          </div>

                                          <div className="flex flex-wrap gap-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                void gradeSubmission(submission);
                                              }}
                                              disabled={!canGrade || gradingNow}
                                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                              {gradingNow ? <FiLoader className="animate-spin" /> : <FiAward />}
                                              <img src={coinIcon} alt={t('gradePage.studio.coinsAlt')} className="h-3.5 w-3.5" />
                                              {t('gradePage.studio.gradeCoinsButton')}
                                            </button>

                                            {submission.resultId && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  void openSubmissionReport(submission);
                                                }}
                                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-white/5"
                                              >
                                                <FiBarChart2 />
                                                {t('gradePage.studio.viewReport')}
                                              </button>
                                            )}

                                            {submission.resultId && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  void openChatModal(submission.resultId, submission.studentName);
                                                }}
                                                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400 transition hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                                              >
                                                <FiMessageSquare />
                                                Chat
                                              </button>
                                            )}

                                            <button
                                              type="button"
                                              onClick={() => {
                                                void deleteSubmission(submission.id);
                                              }}
                                              disabled={deletingNow}
                                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10 disabled:cursor-not-allowed"
                                            >
                                              {deletingNow ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                                              {t('common.delete')}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'results' && (
                            <div className="space-y-4">
                              {!results.length ? (
                                <EmptyState
                                  icon={<FiAward />}
                                  title="No graded results yet"
                                  subtitle="Grade ready submissions to unlock AI analytics, score trends, and detailed feedback."
                                />
                              ) : (
                                <>
                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <MetricCard label="Average" value={formatPercent(analytics.average)} icon={<FiTrendingUp />} tone="indigo" />
                                    <MetricCard label="Highest" value={formatPercent(analytics.highest)} icon={<FiCheckCircle />} tone="green" />
                                    <MetricCard label="Lowest" value={formatPercent(analytics.lowest)} icon={<FiAlertTriangle />} tone="amber" />
                                    <MetricCard label="Pass Rate" value={formatPercent(analytics.passRate)} icon={<FiAward />} tone="red" />
                                  </div>

                                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111111] p-4">
                                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Score Progress Trend</h3>
                                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Chronological grading performance across students.</p>
                                      <div className="mt-3 h-40 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-2">
                                        <svg viewBox="0 0 100 100" className="h-full w-full">
                                          <defs>
                                            <linearGradient id="scoreLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                              <stop offset="0%" stopColor="#6366f1" />
                                              <stop offset="100%" stopColor="#818cf8" />
                                            </linearGradient>
                                          </defs>
                                          <polyline
                                            points={resultsTrendPoints}
                                            fill="none"
                                            stroke="url(#scoreLineGradient)"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </div>
                                    </div>

                                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111111] p-4">
                                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Leaderboard</h3>
                                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Top scores by percentage.</p>
                                      <div className="mt-3 space-y-2">
                                        {[...results]
                                          .sort((a, b) => b.percentage - a.percentage)
                                          .slice(0, 5)
                                          .map((result, index) => (
                                            <div
                                              key={result.id}
                                              className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 py-2"
                                            >
                                              <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                  #{index + 1} {result.studentName}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{result.score}/{result.totalMarks}</p>
                                              </div>
                                              <span className="rounded-full bg-green-100 dark:bg-green-500/20 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                                                {formatPercent(result.percentage)}
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-4 2xl:grid-cols-12">
                                    <div className="2xl:col-span-5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111111] p-4">
                                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">All Results</h3>
                                      <div className="mt-3 space-y-2">
                                        {results
                                          .slice()
                                          .sort((a, b) => b.percentage - a.percentage)
                                          .map((result) => {
                                            const isActive = result.id === selectedResultId;
                                            const deletingNow = deletingId === `result-${result.id}`;
                                            return (
                                              <button
                                                key={result.id}
                                                type="button"
                                                onClick={() => setSelectedResultId(result.id)}
                                                className={`w-full rounded-xl border p-3 text-left transition ${
                                                  isActive
                                                    ? 'border-indigo-500 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10'
                                                    : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-white/5'
                                                }`}
                                              >
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{result.studentName}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{result.score}/{result.totalMarks} • {formatDate(result.createdAt)}</p>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <span className="rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-2 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                                                      {formatPercent(result.percentage)}
                                                    </span>
                                                    <button
                                                      type="button"
                                                      onClick={(event) => {
                                                        event.stopPropagation();
                                                        void deleteResult(result.id);
                                                      }}
                                                      disabled={deletingNow}
                                                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10 disabled:cursor-not-allowed"
                                                    >
                                                      {deletingNow ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                                                    </button>
                                                  </div>
                                                </div>
                                              </button>
                                            );
                                          })}
                                      </div>
                                    </div>

                                    <div className="2xl:col-span-7 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-4">
                                      {selectedResultDetail || selectedResultFromList ? (
                                        <ResultDetailCard result={selectedResultDetail || selectedResultFromList!} />
                                      ) : (
                                        <EmptyState
                                          icon={<FiBarChart2 />}
                                          title="Select a result"
                                          subtitle="Choose any result on the left to review AI feedback and question-wise details."
                                        />
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </section>

          {showSubmissionUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('gradePage.studio.uploadModal.title')}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('gradePage.studio.uploadModal.subtitle')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!uploadingSubmission) {
                        setShowSubmissionUploadModal(false);
                        setUploadModalFile(null);
                      }
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label={t('common.close')}
                  >
                    <FiX />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={uploadModalStudentName}
                    onChange={(event) => setUploadModalStudentName(event.target.value)}
                    placeholder={t('gradePage.studio.uploadModal.studentNamePlaceholder')}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 transition-colors"
                  />

                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-3 text-sm text-amber-800 dark:text-amber-300">
                    <span className="truncate">{uploadModalFile?.name || t('gradePage.studio.uploadModal.selectFile')}</span>
                    <span className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white flex-shrink-0">{t('gradePage.studio.uploadModal.browse')}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(event) => setUploadModalFile(event.target.files?.[0] || null)}
                      accept=".pdf,.doc,.docx"
                    />
                  </label>

                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('gradePage.studio.uploadModal.formats')}</p>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubmissionUploadModal(false);
                      setUploadModalFile(null);
                    }}
                    className="rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmissionUploadFromModal}
                    disabled={uploadingSubmission}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingSubmission ? <FiLoader className="animate-spin" /> : <FiUpload />}
                    {t('gradePage.studio.uploadModal.submit')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {previewModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] shadow-2xl">
                <div className="flex items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 px-4 py-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">{previewModal.title}</h3>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{previewModal.fileName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={previewModal.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      {t('gradePage.studio.previewModal.openOriginal')}
                    </a>
                    <button
                      type="button"
                      onClick={() => setPreviewModal((current) => ({ ...current, open: false }))}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      aria-label={t('common.close')}
                    >
                      <FiX />
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 bg-gray-100 dark:bg-[#111111]">
                  {previewModal.type === 'pdf' && <iframe src={previewModal.fileUrl} title={previewModal.fileName} className="h-full w-full" />}
                  {previewModal.type === 'image' && (
                    <div className="flex h-full items-center justify-center p-4">
                      <img src={previewModal.fileUrl} alt={previewModal.fileName} className="max-h-full max-w-full rounded-xl object-contain" />
                    </div>
                  )}
                  {previewModal.type === 'office' && (
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewModal.fileUrl)}`}
                      title={previewModal.fileName}
                      className="h-full w-full"
                    />
                  )}
                  {previewModal.type === 'other' && (
                    <div className="flex h-full items-center justify-center p-6 text-center text-gray-500 dark:text-gray-400">
                      {t('gradePage.studio.previewModal.unsupported')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showSubmissionReportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 px-4 py-3">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('gradePage.studio.reportModal.title')}</h3>
                  <button
                    type="button"
                    onClick={() => setShowSubmissionReportModal(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label={t('common.close')}
                  >
                    <FiX />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  {selectedResultDetail || selectedResultFromList ? (
                    <ResultDetailCard result={selectedResultDetail || selectedResultFromList!} />
                  ) : (
                    <EmptyState
                      icon={<FiBarChart2 />}
                      title={t('gradePage.studio.selectResultTitle')}
                      subtitle={t('gradePage.studio.selectResultSubtitle')}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {chatModal.open && (
            <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-[#111111] sm:items-center sm:justify-center sm:bg-black/80 sm:p-4 sm:backdrop-blur-sm">
              <div className="flex h-full w-full flex-col bg-white dark:bg-[#111111] sm:h-[90vh] sm:max-w-2xl sm:rounded-2xl sm:border sm:border-gray-200 sm:dark:border-white/10 sm:shadow-2xl sm:overflow-hidden">

                {/* Header */}
                <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                      <FiMessageSquare size={15} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        AI Chat — {chatModal.studentName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ask about this paper's results</p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void clearChatHistory()}
                      disabled={clearingChat || chatStreaming || chatMessages.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {clearingChat ? <FiLoader className="animate-spin" size={11} /> : <FiTrash2 size={11} />}
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={closeChatModal}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label="Close chat"
                    >
                      <FiX />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  {chatLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <FiLoader className="animate-spin" />
                        Loading chat history…
                      </div>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                      <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                        <FiMessageSquare size={26} />
                      </span>
                      <p className="text-base font-semibold text-gray-800 dark:text-gray-100">Start a conversation</p>
                      <p className="mt-1.5 max-w-xs text-sm text-gray-500 dark:text-gray-400">
                        Ask anything about this student's paper — scores, question-level feedback, or how to improve.
                      </p>
                      <div className="mt-6 grid w-full max-w-sm grid-cols-1 gap-2">
                        {[
                          'Why did I lose marks on question 3?',
                          'What are the main weaknesses in this paper?',
                          'How can this student improve their score?',
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              setChatInput(suggestion);
                              chatInputRef.current?.focus();
                            }}
                            className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 py-2.5 text-left text-xs font-medium text-gray-600 dark:text-gray-300 transition hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {msg.role === 'assistant' ? (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 select-none">
                                AI
                              </span>
                            ) : (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 dark:bg-white/10 text-[10px] font-bold text-gray-600 dark:text-gray-300 select-none">
                                You
                              </span>
                            )}
                          </div>

                          {/* Bubble */}
                          <div className={`min-w-0 max-w-[85%] sm:max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                            {msg.role === 'user' ? (
                              <div className="rounded-2xl rounded-tr-sm bg-gray-100 dark:bg-[#27272a] px-4 py-2.5 text-sm leading-relaxed text-gray-900 dark:text-white">
                                {msg.content}
                              </div>
                            ) : (
                              <div className="w-full">
                                {!msg.content ? (
                                  /* Typing dots while streaming */
                                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3">
                                    <span className="h-2 w-2 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-bounce [animation-delay:0ms]" />
                                    <span className="h-2 w-2 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-bounce [animation-delay:150ms]" />
                                    <span className="h-2 w-2 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-bounce [animation-delay:300ms]" />
                                  </div>
                                ) : (
                                  <div className="prose prose-sm dark:prose-invert max-w-full break-words overflow-x-hidden text-gray-800 dark:text-gray-100 [&_.katex-display]:max-w-full [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm, remarkMath]}
                                      rehypePlugins={[rehypeRaw, rehypeKatex]}
                                      components={{
                                        h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3 mt-5 border-b border-gray-200 dark:border-gray-700 pb-1.5" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 mt-4 border-b border-gray-200 dark:border-gray-800 pb-1" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 text-sm" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300 my-3 text-sm" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1.5 text-gray-700 dark:text-gray-300 my-3 text-sm" {...props} />,
                                        li: ({ node, ...props }) => <li className="pl-0.5" {...props} />,
                                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-400 dark:border-indigo-500 pl-3 italic text-gray-600 dark:text-gray-400 my-4 bg-indigo-50/60 dark:bg-indigo-500/5 py-2 pr-3 rounded-r" {...props} />,
                                        hr: ({ node, ...props }) => <hr className="border-gray-200 dark:border-gray-700 my-5" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900 dark:text-white" {...props} />,
                                        em: ({ node, ...props }) => <em className="italic text-gray-700 dark:text-gray-200" {...props} />,
                                        table: ({ node, ...props }) => (
                                          <div className="overflow-x-auto my-4">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-xs" {...props} />
                                          </div>
                                        ),
                                        thead: ({ node, ...props }) => <thead className="bg-gray-50 dark:bg-gray-800" {...props} />,
                                        th: ({ node, ...props }) => <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700" {...props} />,
                                        td: ({ node, ...props }) => <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700" {...props} />,
                                        a: ({ node, ...props }) => <a className="text-indigo-600 dark:text-indigo-400 hover:underline" target="_blank" rel="noreferrer" {...props} />,
                                        code: ({ node, className, children, ...props }) => {
                                          const match = /language-(\w+)/.exec(className || '');
                                          const lang = match ? match[1] : '';
                                          if (lang === 'svg') {
                                            const svgStr = String(children).trim();
                                            const safeSvg = DOMPurify.sanitize(svgStr, { USE_PROFILES: { svg: true, svgFilters: true } });
                                            return <div className="my-2 overflow-x-auto" dangerouslySetInnerHTML={{ __html: safeSvg }} />;
                                          }
                                          return !match ? (
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs text-indigo-600 dark:text-indigo-300 font-mono" {...props}>
                                              {children}
                                            </code>
                                          ) : (
                                            <code className={className} {...props}>{children}</code>
                                          );
                                        },
                                        pre: ({ node, ...props }) => <pre className="max-w-full overflow-x-auto rounded-lg p-3 bg-gray-100 dark:bg-gray-900 text-xs my-3" {...props} />,
                                        img: ({ node, ...props }) => <img className="max-w-full h-auto rounded-lg" {...props} />,
                                      }}
                                    >
                                      {msg.content}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Timestamp */}
                            {msg.createdAt && (
                              <p className="mt-1 px-1 text-[10px] text-gray-400 dark:text-gray-500">
                                {(() => {
                                  const d = new Date(msg.createdAt);
                                  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                })()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={chatMessagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input bar */}
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 py-3">
                  <div className="flex items-end gap-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111111] px-3 py-2 transition-colors focus-within:border-indigo-500 dark:focus-within:border-indigo-500/50">
                    <textarea
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        // auto-grow
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void sendChatMessage();
                        }
                      }}
                      placeholder="Ask about this paper… (Enter to send)"
                      rows={1}
                      className="min-h-[36px] max-h-[120px] flex-1 resize-none bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none leading-[1.5] self-center"
                    />
                    <button
                      type="button"
                      onClick={() => void sendChatMessage()}
                      disabled={!chatInput.trim() || chatStreaming}
                      className="mb-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {chatStreaming ? <FiLoader className="animate-spin" size={14} /> : <FiSend size={14} />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-center text-[10px] text-gray-400 dark:text-gray-500">
                    This AI only has context about this specific paper · Shift+Enter for new line
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const TabButton: React.FC<{
  title: string;
  subtitle: string;
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ title, subtitle, active, icon, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-left transition ${
        active
          ? 'border-indigo-500 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10'
          : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] hover:bg-gray-50 dark:hover:bg-white/5'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 text-base ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>{icon}</span>
        <div>
          <p className={`text-sm font-semibold ${active ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>{title}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
    </button>
  );
};

const StatusPill: React.FC<{ status: string; tone: string }> = ({ status, tone }) => {
  const className =
    tone === 'ready'
      ? 'border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
      : tone === 'failed'
      ? 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
      : 'border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400';

  const icon = tone === 'ready' ? <FiCheckCircle /> : tone === 'failed' ? <FiAlertTriangle /> : <FiClock />;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {icon}
      {status}
    </span>
  );
};

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({
  icon,
  title,
  subtitle,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111111] p-6 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-500 shadow-sm">
        {icon}
      </div>
      <h3 className="mt-3 text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'indigo' | 'green' | 'amber' | 'red';
}> = ({ icon, label, value, color }) => {
  const styleMap: Record<string, string> = {
    indigo: 'border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
    green: 'border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400',
    amber: 'border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
    red: 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
  };

  return (
    <div className={`rounded-xl border px-3 py-2 ${styleMap[color]}`}>
      <div className="text-base">{icon}</div>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'indigo' | 'green' | 'amber' | 'red';
}> = ({ label, value, icon, tone }) => {
  const styleMap: Record<string, string> = {
    indigo: 'border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
    green: 'border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400',
    amber: 'border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
    red: 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
  };

  return (
    <div className={`rounded-xl border p-3 ${styleMap[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        <span className="text-sm">{icon}</span>
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
};

const Badge: React.FC<{ label: string; value: number; tone: 'green' | 'amber' | 'red' }> = ({
  label,
  value,
  tone,
}) => {
  const styleMap: Record<string, string> = {
    green: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
    red: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center justify-center rounded-lg px-1.5 py-1 font-semibold text-[10px] ${styleMap[tone]}`}>
      {label}: {value}
    </span>
  );
};

const ResultDetailCard: React.FC<{ result: ResultItem }> = ({ result }) => {
  return (
    <div>
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111111] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{result.studentName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Graded on {formatDate(result.createdAt)}</p>
          </div>
          <div className="rounded-xl bg-indigo-100 dark:bg-indigo-500/20 px-3 py-2 text-indigo-800 dark:text-indigo-300">
            <p className="text-xs font-semibold uppercase tracking-wide">Score</p>
            <p className="text-lg font-bold">
              {result.score}/{result.totalMarks} ({formatPercent(result.percentage)})
            </p>
          </div>
        </div>
      </div>

      {result.feedback && (
        <div className="mt-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] p-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">AI Summary</h4>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{result.feedback}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 p-4">
          <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">Strengths</h4>
          {result.strengths.length ? (
            <ul className="mt-2 space-y-1 text-sm text-green-800 dark:text-green-300">
              {result.strengths.map((strength, index) => (
                <li key={`${strength}-${index}`} className="rounded-lg bg-white/70 dark:bg-white/5 px-2 py-1">
                  {strength}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-green-700 dark:text-green-400">No strengths generated yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4">
          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Weaknesses</h4>
          {result.weaknesses.length ? (
            <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-300">
              {result.weaknesses.map((weakness, index) => (
                <li key={`${weakness}-${index}`} className="rounded-lg bg-white/70 dark:bg-white/5 px-2 py-1">
                  {weakness}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">No weaknesses generated yet.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] p-4">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Question Breakdown</h4>
        {!result.questionBreakdown.length ? (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No question-level details available.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {result.questionBreakdown.map((question, index) => {
              const percent = question.maxScore > 0 ? (question.score / question.maxScore) * 100 : 0;
              return (
                <div key={`${question.question}-${index}`} className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1a1a1a] p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{question.question}</p>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {question.score}/{question.maxScore}
                    </p>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
                  </div>
                  {question.feedback && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{question.feedback}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GradePage;
