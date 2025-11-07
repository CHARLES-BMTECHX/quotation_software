import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchQuotations, deleteQuotation } from '../api/api';
import { Link } from 'react-router-dom';
import PDFDownloadButton from './PDFDownloadButton';
import { 
  Trash2, Search, ChevronLeft, ChevronRight, AlertCircle, Edit
} from 'lucide-react';
import { toast } from 'react-toastify';
import InvoicePdf from './InvoicePdf';

export default function QuotationTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery(
    ['quotations', page, search, limit],
    () => fetchQuotations({ page, limit, search }),
    { 
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000
    }
  );

  const deleteMutation = useMutation(deleteQuotation, {
    onSuccess: () => {
      queryClient.invalidateQueries(['quotations']);
      toast.success('Quotation deleted successfully');
      setShowDeleteModal(false);
      setDeletingId(null);
    },
    onError: () => {
      toast.error('Failed to delete quotation');
    }
  });

  // Correct: data.data is the array
  const quotations = data?.data || [];
  const pagination = data?.pagination || {};
  const totalRecords = pagination.total || 0;
  const totalPages = pagination.pages || 1;
  const hasNextPage = page < totalPages && totalRecords > 0;
  const hasPrevPage = page > 1;

  const openDeleteModal = (id) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingId(null);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deletingId);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 space-y-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 h-16 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-500/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle size={28} />
              <h3 className="text-xl font-bold">Delete Quotation?</h3>
            </div>
            <p className="text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isLoading}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition flex items-center gap-2 disabled:opacity-70"
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-yellow-600 to-yellow-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* <h2 className="text-xl sm:text-2xl font-bold text-white">
              All Quotations ({totalRecords})
            </h2> */}
            
            <div className="flex items-center gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-200" size={18} />
                <input
                  type="text"
                  placeholder="Search customer / store..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border-0 rounded-lg text-sm focus:ring-2 focus:ring-yellow-300 bg-white/20 text-white placeholder-yellow-200"
                />
              </div>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-3 py-2 bg-white/20 text-white border border-white/30 rounded-lg focus:ring-2 focus:ring-yellow-300"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {quotations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No quotations found</p>
            {search && <p className="text-sm mt-2 text-gray-400">Try adjusting your search</p>}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-yellow-50 text-yellow-800 font-semibold">
                    <th className="px-6 py-4 text-left">Customer</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Store</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quotations?.data?.map((q) => (
                    <tr key={q._id} className="hover:bg-yellow-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{q.modelName}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(q.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{q.storeName}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-700">
                        ₹{q.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <PDFDownloadButton id={q._id} />
                          <InvoicePdf id={q._id} />
                          <Link to={`/edit/${q._id}`} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition">
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => openDeleteModal(q._id)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden p-4 space-y-4">
              {quotations?.data?.map((q) => (
                <div key={q._id} className="bg-gradient-to-r from-yellow-50 to-white p-5 rounded-xl shadow-md border border-yellow-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{q.modelName}</h3>
                      <p className="text-sm text-gray-600">{q.storeName}</p>
                    </div>
                    <span className="text-lg font-bold text-green-700">
                      ₹{q.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {new Date(q.date).toLocaleDateString('en-GB')}
                  </div>
                  <div className="flex justify-end gap-2">
                    <PDFDownloadButton id={q._id} />
                     <InvoicePdf id={q._id} />
                    <Link to={`/edit/${q._id}`} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => openDeleteModal(q._id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {(totalPages > 1 || isFetching) && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={!hasPrevPage}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <ChevronLeft size={18} />
                Prev
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-medium">Page {page} of {totalPages}</span>
                {isFetching && (
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!hasNextPage}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="text-center text-sm text-gray-500 mt-2">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalRecords)} of {totalRecords} results
            </div>
          </div>
        )}
      </div>
    </>
  );
}