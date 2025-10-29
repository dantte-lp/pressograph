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

} from '@heroui/react';
import { TableSkeleton } from "../components/skeletons";
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n';
import {
  getHistory,
  deleteGraph,
  downloadGraph,
  createShareLink,
  formatFileSize,
  formatGenerationTime,
  formatRelativeTime,
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
  const [sharingId, setSharingId] = useState<number | null>(null);

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
      toast.error(t.historyToast.deleteError);
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
  const handleDownload = useCallback(async (graphId: number) => {
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
  }, [t]);

  /**
   * Handle share button click
   */
  const handleShare = useCallback(async (graphId: number) => {
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
  }, [t]);

  /**
   * Handle view button click
   */
  const handleView = useCallback((graph: GraphHistoryItem) => {
    setPreviewGraph(graph);
    setPreviewModalOpen(true);
  }, []);

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
                <h2 className="text-2xl font-semibold mb-2">
                  {t.historyEmpty.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
                  {t.historyEmpty.description}
                </p>
                <Button
                  color="primary"
                  size="lg"
                  onPress={() => navigate('/')}
                >
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col gap-4 pb-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold">
                {t.historyTitle}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t.historySubtitle}
              </p>
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
              <TableSkeleton rows={5} columns={7} showCard={false} />
            ) : graphs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">
                  {t.historyNoResults}
                </h3>
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
                  aria-label={t.historyTitle}
                  className="mb-4"
                >
                  <TableHeader>
                    <TableColumn>{t.historyTable.testNumber}</TableColumn>
                    <TableColumn>{t.historyTable.format}</TableColumn>
                    <TableColumn>{t.historyTable.fileSize}</TableColumn>
                    <TableColumn>{t.historyTable.generationTime}</TableColumn>
                    <TableColumn>{t.historyTable.createdAt}</TableColumn>
                    <TableColumn>{t.historyTable.status}</TableColumn>
                    <TableColumn align="center">{t.historyTable.actions}</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {graphs.map((graph) => (
                      <TableRow key={graph.id}>
                        <TableCell>
                          <span className="font-mono font-semibold">
                            {graph.test_number}
                          </span>
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
                        <TableCell>{formatGenerationTime(graph.generation_time_ms)}</TableCell>
                        <TableCell>{formatRelativeTime(graph.created_at)}</TableCell>
                        <TableCell>
                          <Chip
                            color={getStatusColor(graph.status)}
                            size="sm"
                            variant="dot"
                          >
                            {t.historyStatus[graph.status as keyof typeof t.historyStatus]}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              color="primary"
                              variant="light"
                              onPress={() => handleView(graph)}
                            >
                              {t.historyActions.view}
                            </Button>
                            <Button
                              size="sm"
                              color="success"
                              variant="light"
                              onPress={() => handleDownload(graph.id)}
                              isDisabled={!graph.file_path}
                              isLoading={downloadingId === graph.id}
                            >
                              {t.historyActions.download}
                            </Button>
                            <Button
                              size="sm"
                              color="secondary"
                              variant="light"
                              onPress={() => handleShare(graph.id)}
                              isLoading={sharingId === graph.id}
                            >
                              {t.historyActions.share}
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              variant="light"
                              onPress={() => handleDeleteClick(graph.id)}
                            >
                              {t.historyActions.delete}
                            </Button>
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
      >
        <ModalContent>
          <ModalHeader>{t.historyDeleteModal.title}</ModalHeader>
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
            <Button
              color="danger"
              onPress={handleDeleteConfirm}
              isLoading={isDeleting}
            >
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
      >
        <ModalContent>
          <ModalHeader>
            {t.historyActions.view}: {previewGraph?.test_number}
          </ModalHeader>
          <ModalBody>
            {previewGraph && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                      {t.historyTable.createdAt}
                    </p>
                    <p>{new Date(previewGraph.created_at).toLocaleString()}</p>
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
                        <span className="text-gray-600 dark:text-gray-400">{t.workingPressure}: </span>
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
              <Button
                color="success"
                onPress={() => handleDownload(previewGraph.id)}
              >
                {t.historyActions.download}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default History;
