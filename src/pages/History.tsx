// ═══════════════════════════════════════════════════════════════════
// History Page - Graph History and Management
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Pagination,
  RadioGroup,
  Radio,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Textarea,
} from '@heroui/react';
import { TableSkeleton } from '../components/skeletons';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import {
  getHistory,
  deleteGraph,
  downloadGraph,
  createShareLink,
  regenerateGraph,
  updateComment,
  formatFileSize,
  formatGenerationTime,
  formatRelativeTime,
  formatDate,
  type GraphHistoryItem,
  type HistoryQueryParams,
} from '../services/api.service';

/**
 * History Page Component
 * Displays and manages pressure test graph history
 */
export const History: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // State Management
  const [graphs, setGraphs] = useState<GraphHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filter State
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'test_number'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [graphToDelete, setGraphToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewGraph, setPreviewGraph] = useState<GraphHistoryItem | null>(null);

  // Loading states for async actions
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingJSONId, setDownloadingJSONId] = useState<number | null>(null);
  const [sharingId, setSharingId] = useState<number | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);

  // Regenerate modal state
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [graphToRegenerate, setGraphToRegenerate] = useState<GraphHistoryItem | null>(null);
  const [regenerateFormat, setRegenerateFormat] = useState<'png' | 'pdf' | 'json'>('png');
  const [regenerateTheme, setRegenerateTheme] = useState<'light' | 'dark'>('light');

  // Edit comment state
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editedComment, setEditedComment] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);

  // Keyboard shortcuts
  // Esc to close modals
  useKeyboardShortcut({
    key: 'Escape',
    callback: () => {
      if (deleteModalOpen && !isDeleting) {
        setDeleteModalOpen(false);
        setGraphToDelete(null);
      }
      if (previewModalOpen) {
        setPreviewModalOpen(false);
        setPreviewGraph(null);
      }
    },
    enabled: deleteModalOpen || previewModalOpen,
  });

  /**
   * Fetch history data from backend
   */
  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);

      const params: HistoryQueryParams = {
        limit,
        offset: (page - 1) * limit,
        search: search || undefined,
        format: format !== 'all' ? format : undefined,
        sortBy,
        sortOrder,
      };

      const response = await getHistory(params);
      setGraphs(response.graphs);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error(t.historyToast.fetchError);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, format, sortBy, sortOrder, t]);

  /**
   * Fetch history on mount and when filters change
   */
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /**
   * Debounced search handler
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  /**
   * Handle delete button click
   */
  const handleDeleteClick = useCallback((graphId: number) => {
    setGraphToDelete(graphId);
    setDeleteModalOpen(true);
  }, []);

  /**
   * Confirm delete action
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!graphToDelete) return;

    try {
      setIsDeleting(true);
      await deleteGraph(graphToDelete);
      toast.success(t.historyToast.deleteSuccess);
      setDeleteModalOpen(false);
      setGraphToDelete(null);
      // Refresh history
      await fetchHistory();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(t.historyToast.deleteError);
    } finally {
      setIsDeleting(false);
    }
  }, [graphToDelete, fetchHistory, t]);

  /**
   * Handle download button click
   */
  const handleDownload = useCallback(
    async (graphId: number) => {
      try {
        setDownloadingId(graphId);
        const { blob, filename } = await downloadGraph(graphId);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
        toast.error(t.historyToast.downloadError);
      } finally {
        setDownloadingId(null);
      }
    },
    [t]
  );

  /**
   * Handle download JSON settings button click
   * Downloads the settings JSON directly from the database without regenerating
   */
  const handleDownloadJSON = useCallback(
    async (graph: GraphHistoryItem) => {
      try {
        setDownloadingJSONId(graph.id);

        // Create JSON from graph settings
        const exportData = {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          settings: graph.settings,
          graphData: null, // We don't store graphData in database, only settings
          comment: graph.comment || null,
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const filename = `graph-${graph.test_number}-${Date.now()}.json`;

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(t.historyToast.jsonExported);
      } catch (error) {
        console.error('Download JSON failed:', error);
        toast.error(t.historyToast.downloadError);
      } finally {
        setDownloadingJSONId(null);
      }
    },
    [t]
  );

  /**
   * Handle share button click
   */
  const handleShare = useCallback(
    async (graphId: number) => {
      try {
        setSharingId(graphId);
        const response = await createShareLink({
          graphId,
          allowDownload: true,
        });

        // Copy to clipboard
        await navigator.clipboard.writeText(response.shareLink.url);
        toast.success(t.historyToast.shareSuccess);
      } catch (error) {
        console.error('Share failed:', error);
        toast.error(t.historyToast.shareError);
      } finally {
        setSharingId(null);
      }
    },
    [t]
  );

  /**
   * Handle view button click
   */
  const handleView = useCallback((graph: GraphHistoryItem) => {
    setPreviewGraph(graph);
    setEditedComment(graph.comment || '');
    setIsEditingComment(false);
    setPreviewModalOpen(true);
  }, []);

  /**
   * Handle save comment
   */
  const handleSaveComment = useCallback(async () => {
    if (!previewGraph) return;

    try {
      setIsSavingComment(true);
      await updateComment(previewGraph.id, editedComment);
      toast.success(t.historyToast.commentUpdated);

      // Update preview graph
      setPreviewGraph({ ...previewGraph, comment: editedComment });
      setIsEditingComment(false);

      // Refresh history to show updated comment
      await fetchHistory();
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error(t.historyToast.commentUpdateError);
    } finally {
      setIsSavingComment(false);
    }
  }, [previewGraph, editedComment, fetchHistory]);

  /**
   * Handle regenerate button click
   */
  const handleRegenerateClick = useCallback((graph: GraphHistoryItem) => {
    setGraphToRegenerate(graph);
    setRegenerateFormat(graph.export_format as 'png' | 'pdf' | 'json');
    setRegenerateTheme('light');
    setRegenerateModalOpen(true);
  }, []);

  /**
   * Confirm regenerate action
   */
  const handleRegenerateConfirm = useCallback(async () => {
    if (!graphToRegenerate) return;

    try {
      setRegeneratingId(graphToRegenerate.id);
      setRegenerateModalOpen(false);

      const toastId = toast.loading(
        `${t.historyActions.regenerate} ${regenerateFormat.toUpperCase()}...`
      );

      const { blob, filename, metadata } = await regenerateGraph(graphToRegenerate.id, {
        format: regenerateFormat,
        theme: regenerateTheme,
        scale: 4,
        width: 1200,
        height: 800,
      });

      // Download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `${t.historyToast.graphRegenerated}\n${formatFileSize(metadata.fileSize)} • ${formatGenerationTime(metadata.generationTimeMs)}`,
        {
          id: toastId,
          duration: 3000,
        }
      );

      // Refresh history to show new version
      await fetchHistory();
    } catch (error) {
      console.error('Regenerate failed:', error);
      toast.error(`${t.historyToast.regenerateError}: ${(error as Error).message}`, {
        duration: 5000,
      });
    } finally {
      setRegeneratingId(null);
      setGraphToRegenerate(null);
    }
  }, [graphToRegenerate, regenerateFormat, regenerateTheme, fetchHistory]);

  /**
   * Handle sort change
   */
  const handleSortChange = useCallback((value: string) => {
    if (value === 'newest') {
      setSortBy('created_at');
      setSortOrder('desc');
    } else if (value === 'oldest') {
      setSortBy('created_at');
      setSortOrder('asc');
    } else if (value === 'testNumber') {
      setSortBy('test_number');
      setSortOrder('asc');
    }
    setPage(1);
  }, []);

  /**
   * Get status chip color
   */
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  }, []);

  /**
   * Get format chip color
   */
  const getFormatColor = useCallback((format: string) => {
    switch (format) {
      case 'png':
        return 'primary';
      case 'pdf':
        return 'secondary';
      case 'json':
        return 'success';
      default:
        return 'default';
    }
  }, []);

  /**
   * Calculate pagination values
   */
  const paginationInfo = useMemo(() => {
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    return { from, to };
  }, [page, limit, total]);

  /**
   * Total pages
   */
  const totalPages = useMemo(() => {
    return Math.ceil(total / limit);
  }, [total, limit]);

  /**
   * Empty state
   */
  if (!isLoading && graphs.length === 0 && !search && format === 'all') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <Card className="shadow-lg">
            <CardBody>
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-semibold mb-2">{t.historyEmpty.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
                  {t.historyEmpty.description}
                </p>
                <Button color="primary" size="lg" onPress={() => navigate('/')}>
                  {t.historyEmpty.button}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8"
      role="main"
      aria-label={t.accessibility?.historyPage || 'Test history page'}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col gap-4 pb-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold">{t.historyTitle}</h1>
              <p className="text-gray-600 dark:text-gray-400">{t.historySubtitle}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 w-full">
              {/* Search */}
              <Input
                placeholder={t.historySearchPlaceholder}
                value={search}
                onValueChange={setSearch}
                className="flex-1"
                isClearable
                aria-label={t.accessibility?.searchHistory || 'Search test history'}
              />

              {/* Format Filter */}
              <Select
                label={t.historyFilters.format}
                selectedKeys={[format]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFormat(selected);
                  setPage(1);
                }}
                className="w-full md:w-48"
              >
                <SelectItem key="all">{t.historyFilters.allFormats}</SelectItem>
                <SelectItem key="png">PNG</SelectItem>
                <SelectItem key="pdf">PDF</SelectItem>
                <SelectItem key="json">JSON</SelectItem>
              </Select>

              {/* Sort */}
              <Select
                label={t.historyFilters.sortBy}
                selectedKeys={[
                  sortBy === 'created_at' && sortOrder === 'desc'
                    ? 'newest'
                    : sortBy === 'created_at' && sortOrder === 'asc'
                      ? 'oldest'
                      : 'testNumber',
                ]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  handleSortChange(selected);
                }}
                className="w-full md:w-48"
              >
                <SelectItem key="newest">{t.historyFilters.newestFirst}</SelectItem>
                <SelectItem key="oldest">{t.historyFilters.oldestFirst}</SelectItem>
                <SelectItem key="testNumber">{t.historyFilters.byTestNumber}</SelectItem>
              </Select>
            </div>

            {/* Results Info */}
            {total > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t.historyShowingResults
                  .replace('{{from}}', paginationInfo.from.toString())
                  .replace('{{to}}', paginationInfo.to.toString())
                  .replace('{{total}}', total.toString())}
              </div>
            )}
          </CardHeader>

          <CardBody>
            {isLoading ? (
              <TableSkeleton rows={5} columns={8} showCard={false} />
            ) : graphs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">{t.historyNoResults}</h3>
                <Button
                  color="default"
                  variant="light"
                  onPress={() => {
                    setSearch('');
                    setFormat('all');
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                {/* Table */}
                <Table
                  aria-label={t.accessibility?.historyTable || 'Test history table'}
                  className="mb-4"
                >
                  <TableHeader>
                    <TableColumn className="select-text w-16">ID</TableColumn>
                    <TableColumn className="select-text w-32">
                      {t.historyTable.testNumber}
                    </TableColumn>
                    <TableColumn className="select-text w-20">{t.historyTable.format}</TableColumn>
                    <TableColumn className="select-text w-24">
                      {t.historyTable.fileSize}
                    </TableColumn>
                    <TableColumn className="select-text w-40">
                      {t.historyTable.creationDate}
                    </TableColumn>
                    <TableColumn className="select-text w-32">{t.historyTable.comment}</TableColumn>
                    <TableColumn className="select-text w-24">{t.historyTable.status}</TableColumn>
                    <TableColumn className="select-text" align="center">
                      {t.historyTable.actions}
                    </TableColumn>
                  </TableHeader>
                  <TableBody>
                    {graphs.map((graph) => (
                      <TableRow
                        key={graph.id}
                        aria-label={`${t.accessibility?.testRow || 'Test result row'} ${graph.test_number}`}
                      >
                        <TableCell>
                          <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                            #{graph.id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-semibold">{graph.test_number}</span>
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={getFormatColor(graph.export_format)}
                            size="sm"
                            variant="flat"
                          >
                            {graph.export_format.toUpperCase()}
                          </Chip>
                        </TableCell>
                        <TableCell>{formatFileSize(graph.file_size)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">{formatDate(graph.created_at)}</span>
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(graph.created_at)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className="text-sm text-gray-700 dark:text-gray-300 block truncate max-w-[15ch]"
                            title={graph.comment || ''}
                          >
                            {graph.comment || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Chip color={getStatusColor(graph.status)} size="sm" variant="dot">
                            {t.historyStatus[graph.status as keyof typeof t.historyStatus]}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Dropdown>
                              <DropdownTrigger>
                                <Button
                                  size="sm"
                                  variant="flat"
                                  endContent={
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  }
                                  aria-label={`Actions for test ${graph.test_number}`}
                                >
                                  {t.historyTable.actions}
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu aria-label="Graph actions">
                                <DropdownItem
                                  key="view"
                                  onPress={() => handleView(graph)}
                                  startContent={
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                  }
                                >
                                  {t.historyActions.view}
                                </DropdownItem>
                                <DropdownItem
                                  key="download"
                                  onPress={() => handleDownload(graph.id)}
                                  isDisabled={!graph.file_path || downloadingId === graph.id}
                                  startContent={
                                    downloadingId === graph.id ? (
                                      <svg
                                        className="w-4 h-4 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                    ) : (
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                      </svg>
                                    )
                                  }
                                >
                                  {t.historyActions.download}
                                </DropdownItem>
                                <DropdownItem
                                  key="downloadJSON"
                                  onPress={() => handleDownloadJSON(graph)}
                                  isDisabled={downloadingJSONId === graph.id}
                                  startContent={
                                    downloadingJSONId === graph.id ? (
                                      <svg
                                        className="w-4 h-4 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                    ) : (
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                        />
                                      </svg>
                                    )
                                  }
                                >
                                  {t.historyActions.downloadJSON}
                                </DropdownItem>
                                <DropdownItem
                                  key="regenerate"
                                  onPress={() => handleRegenerateClick(graph)}
                                  isDisabled={regeneratingId === graph.id}
                                  startContent={
                                    regeneratingId === graph.id ? (
                                      <svg
                                        className="w-4 h-4 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                    ) : (
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                      </svg>
                                    )
                                  }
                                >
                                  {t.historyActions.regenerate}
                                </DropdownItem>
                                <DropdownItem
                                  key="share"
                                  onPress={() => handleShare(graph.id)}
                                  isDisabled={sharingId === graph.id}
                                  startContent={
                                    sharingId === graph.id ? (
                                      <svg
                                        className="w-4 h-4 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                    ) : (
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                        />
                                      </svg>
                                    )
                                  }
                                >
                                  {t.historyActions.share}
                                </DropdownItem>
                                <DropdownItem
                                  key="delete"
                                  onPress={() => handleDeleteClick(graph.id)}
                                  className="text-danger"
                                  color="danger"
                                  startContent={
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  }
                                >
                                  {t.historyActions.delete}
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <Pagination
                      total={totalPages}
                      page={page}
                      onChange={setPage}
                      color="primary"
                      showControls
                    />
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteModalOpen(false);
            setGraphToDelete(null);
          }
        }}
        aria-labelledby="delete-modal-title"
      >
        <ModalContent>
          <ModalHeader id="delete-modal-title">{t.historyDeleteModal.title}</ModalHeader>
          <ModalBody>
            <p>{t.historyDeleteModal.message}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => {
                setDeleteModalOpen(false);
                setGraphToDelete(null);
              }}
              isDisabled={isDeleting}
            >
              {t.historyDeleteModal.cancel}
            </Button>
            <Button color="danger" onPress={handleDeleteConfirm} isLoading={isDeleting}>
              {t.historyDeleteModal.confirm}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewGraph(null);
        }}
        size="2xl"
        aria-labelledby="preview-modal-title"
      >
        <ModalContent>
          <ModalHeader id="preview-modal-title">
            {t.historyActions.view}: {previewGraph?.test_number}
          </ModalHeader>
          <ModalBody>
            {previewGraph && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ID</p>
                    <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                      #{previewGraph.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.historyTable.testNumber}
                    </p>
                    <p className="font-mono font-semibold">{previewGraph.test_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.historyTable.format}
                    </p>
                    <Chip color={getFormatColor(previewGraph.export_format)} size="sm">
                      {previewGraph.export_format.toUpperCase()}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.historyTable.fileSize}
                    </p>
                    <p>{formatFileSize(previewGraph.file_size)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.historyTable.generationTime}
                    </p>
                    <p>{formatGenerationTime(previewGraph.generation_time_ms)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.historyTable.creationDate}
                    </p>
                    <p>{formatDate(previewGraph.created_at)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(previewGraph.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.historyTable.status}
                    </p>
                    <Chip color={getStatusColor(previewGraph.status)} size="sm" variant="dot">
                      {t.historyStatus[previewGraph.status as keyof typeof t.historyStatus]}
                    </Chip>
                  </div>
                </div>

                {/* Comment Section with Edit Capability */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{t.historyCommentModal.title}</h4>
                    {!isEditingComment && (
                      <Button size="sm" variant="flat" onPress={() => setIsEditingComment(true)}>
                        {t.historyCommentModal.edit}
                      </Button>
                    )}
                  </div>
                  {isEditingComment ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedComment}
                        onValueChange={setEditedComment}
                        minRows={3}
                        maxRows={10}
                        variant="bordered"
                        placeholder={t.historyCommentModal.placeholder}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => {
                            setEditedComment(previewGraph.comment || '');
                            setIsEditingComment(false);
                          }}
                          isDisabled={isSavingComment}
                        >
                          {t.historyCommentModal.cancel}
                        </Button>
                        <Button
                          size="sm"
                          color="success"
                          onPress={handleSaveComment}
                          isLoading={isSavingComment}
                        >
                          {t.historyCommentModal.save}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {previewGraph.comment || (
                        <span className="text-gray-400 italic">
                          {t.historyCommentModal.noComment}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Test Settings Preview */}
                {previewGraph.settings && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">{t.testParameters}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t.temperature}: </span>
                        <span>{previewGraph.settings.temperature}°C</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t.testDuration}: </span>
                        <span>{previewGraph.settings.testDuration}h</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          {t.workingPressure}:{' '}
                        </span>
                        <span>{previewGraph.settings.workingPressure} MPa</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t.maxPressure}: </span>
                        <span>{previewGraph.settings.maxPressure} MPa</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              variant="light"
              onPress={() => {
                setPreviewModalOpen(false);
                setPreviewGraph(null);
              }}
            >
              {t.helpCopy !== t.helpCopy ? 'Close' : 'Close'}
            </Button>
            {previewGraph && (
              <Button color="success" onPress={() => handleDownload(previewGraph.id)}>
                {t.historyActions.download}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Regenerate Modal */}
      <Modal
        isOpen={regenerateModalOpen}
        onClose={() => {
          setRegenerateModalOpen(false);
          setGraphToRegenerate(null);
        }}
        size="lg"
        aria-labelledby="regenerate-modal-title"
      >
        <ModalContent>
          <ModalHeader id="regenerate-modal-title">
            {t.historyRegenerateModal.title}: {graphToRegenerate?.test_number}
          </ModalHeader>
          <ModalBody className="gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.historyRegenerateModal.description}
            </p>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t.historyRegenerateModal.exportFormat}
              </label>
              <RadioGroup
                value={regenerateFormat}
                onValueChange={(value) => setRegenerateFormat(value as 'png' | 'pdf' | 'json')}
                orientation="horizontal"
              >
                <Radio value="png" description={t.historyRegenerateModal.highQualityImage}>
                  PNG
                </Radio>
                <Radio value="pdf" description={t.historyRegenerateModal.printableDocument}>
                  PDF
                </Radio>
                <Radio value="json" description={t.historyRegenerateModal.dataExport}>
                  JSON
                </Radio>
              </RadioGroup>
            </div>

            {/* Theme Selection - only for PNG and PDF */}
            {(regenerateFormat === 'png' || regenerateFormat === 'pdf') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t.historyRegenerateModal.graphTheme}
                </label>
                <RadioGroup
                  value={regenerateTheme}
                  onValueChange={(value) => setRegenerateTheme(value as 'light' | 'dark')}
                  orientation="horizontal"
                >
                  <Radio value="light" description={t.historyRegenerateModal.lightBackground}>
                    {t.historyRegenerateModal.lightBackground}
                  </Radio>
                  <Radio value="dark" description={t.historyRegenerateModal.darkBackground}>
                    {t.historyRegenerateModal.darkBackground}
                  </Radio>
                </RadioGroup>
              </div>
            )}

            {graphToRegenerate?.comment && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2 text-sm">
                  {t.historyRegenerateModal.originalComment}
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {graphToRegenerate.comment}
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => {
                setRegenerateModalOpen(false);
                setGraphToRegenerate(null);
              }}
            >
              {t.historyRegenerateModal.cancel}
            </Button>
            <Button color="warning" onPress={handleRegenerateConfirm}>
              {t.historyRegenerateModal.regenerate}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default History;
