import { useCallback, useRef, useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import from 'App.css';
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  RowSelectedEvent,
  BodyScrollEvent,
} from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// ============================================
// TELEMETRY TYPES & SERVICE
// ============================================
interface TelemetryEvent {
  id: string;
  eventType: string;
  timestamp: string;
  data: unknown;
}

interface TelemetryService {
  events: TelemetryEvent[];
  send: (eventType: string, data: unknown) => TelemetryEvent;
  clear: () => void;
}

const createTelemetryService = (): TelemetryService => {
  const events: TelemetryEvent[] = [];

  return {
    events,
    send: (eventType: string, data: unknown): TelemetryEvent => {
      const event: TelemetryEvent = {
        id: crypto.randomUUID(),
        eventType,
        timestamp: new Date().toISOString(),
        data,
      };

      events.unshift(event);

      // Keep only last 50 events
      if (events.length > 50) {
        events.pop();
      }

      console.log("📊 Telemetry Event:", event);

      // In production, send to your backend:
      // fetch('/api/telemetry', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event),
      // });

      return event;
    },
    clear: () => {
      events.length = 0;
    },
  };
};

// Global telemetry service instance
const telemetry = createTelemetryService();

// ============================================
// DATA TYPES
// ============================================
interface RowData {
  id: number;
  product: string;
  category: string;
  price: number;
  quantity: number;
  inStock: boolean;
  lastUpdated: string;
}

// ============================================
// SAMPLE DATA
// ============================================
const generateSampleData = (): RowData[] => [
  {
    id: 1,
    product: 'MacBook Pro 16"',
    category: "Electronics",
    price: 2499,
    quantity: 12,
    inStock: true,
    lastUpdated: "2024-01-15",
  },
  {
    id: 2,
    product: "Logitech MX Master 3",
    category: "Electronics",
    price: 99,
    quantity: 45,
    inStock: true,
    lastUpdated: "2024-01-14",
  },
  {
    id: 3,
    product: "Mechanical Keyboard",
    category: "Electronics",
    price: 149,
    quantity: 28,
    inStock: true,
    lastUpdated: "2024-01-13",
  },
  {
    id: 4,
    product: 'Dell UltraSharp 27"',
    category: "Electronics",
    price: 549,
    quantity: 8,
    inStock: true,
    lastUpdated: "2024-01-12",
  },
  {
    id: 5,
    product: "Herman Miller Aeron",
    category: "Furniture",
    price: 1395,
    quantity: 5,
    inStock: false,
    lastUpdated: "2024-01-11",
  },
  {
    id: 6,
    product: "Standing Desk Pro",
    category: "Furniture",
    price: 799,
    quantity: 15,
    inStock: true,
    lastUpdated: "2024-01-10",
  },
  {
    id: 7,
    product: "Moleskine Notebook",
    category: "Stationery",
    price: 25,
    quantity: 120,
    inStock: true,
    lastUpdated: "2024-01-09",
  },
  {
    id: 8,
    product: "Premium Pen Set",
    category: "Stationery",
    price: 45,
    quantity: 67,
    inStock: true,
    lastUpdated: "2024-01-08",
  },
  {
    id: 9,
    product: "USB-C Hub 7-in-1",
    category: "Electronics",
    price: 79,
    quantity: 89,
    inStock: true,
    lastUpdated: "2024-01-07",
  },
  {
    id: 10,
    product: "Logitech C920 Webcam",
    category: "Electronics",
    price: 69,
    quantity: 34,
    inStock: false,
    lastUpdated: "2024-01-06",
  },
  {
    id: 11,
    product: "AirPods Pro 2",
    category: "Electronics",
    price: 249,
    quantity: 56,
    inStock: true,
    lastUpdated: "2024-01-05",
  },
  {
    id: 12,
    product: 'iPad Pro 12.9"',
    category: "Electronics",
    price: 1099,
    quantity: 19,
    inStock: true,
    lastUpdated: "2024-01-04",
  },
  {
    id: 13,
    product: "Desk Lamp LED",
    category: "Furniture",
    price: 89,
    quantity: 42,
    inStock: true,
    lastUpdated: "2024-01-03",
  },
  {
    id: 14,
    product: "Filing Cabinet",
    category: "Furniture",
    price: 199,
    quantity: 11,
    inStock: false,
    lastUpdated: "2024-01-02",
  },
  {
    id: 15,
    product: "Whiteboard 48x36",
    category: "Office",
    price: 129,
    quantity: 7,
    inStock: true,
    lastUpdated: "2024-01-01",
  },
];

// ============================================
// TELEMETRY EVENT CARD COMPONENT
// ============================================
interface EventCardProps {
  event: TelemetryEvent;
}

const EventCard = ({ event }: EventCardProps) => {
  const getEventColor = (type: string): string => {
    const colors: Record<string, string> = {
      grid_initialized: "bg-emerald-500",
      visible_rows_extracted: "bg-blue-500",
      selected_rows_extracted: "bg-purple-500",
      full_grid_state_extracted: "bg-amber-500",
      row_selected: "bg-indigo-500",
      grid_scrolled: "bg-slate-500",
    };
    return colors[type] || "bg-gray-500";
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`w-2 h-2 rounded-full ${getEventColor(event.eventType)}`}
        />
        <span className="text-sm font-semibold text-white">
          {event.eventType}
        </span>
      </div>
      <div className="text-xs text-slate-400 mb-2">
        {new Date(event.timestamp).toLocaleTimeString()}
      </div>
      <pre className="text-xs text-slate-300 bg-slate-900/50 rounded p-2 overflow-auto max-h-32">
        {JSON.stringify(event.data, null, 2)}
      </pre>
    </div>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  const gridRef = useRef<AgGridReact<RowData>>(null);
  const [gridApi, setGridApi] = useState<GridApi<RowData> | null>(null);
  const [rowData] = useState<RowData[]>(generateSampleData);
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    visibleRows: 0,
    selectedRows: 0,
  });

  // Column definitions
  const [colDefs] = useState<ColDef<RowData>[]>([
    {
      field: "id",
      headerName: "ID",
      width: 80,
      checkboxSelection: true,
      headerCheckboxSelection: true,
    },
    { field: "product", headerName: "Product", flex: 2, filter: true },
    { field: "category", headerName: "Category", flex: 1, filter: true },
    {
      field: "price",
      headerName: "Price",
      flex: 1,
      valueFormatter: (p) => (p.value ? `$${p.value.toLocaleString()}` : ""),
      filter: "agNumberColumnFilter",
    },
    {
      field: "quantity",
      headerName: "Qty",
      width: 100,
      filter: "agNumberColumnFilter",
    },
    {
      field: "inStock",
      headerName: "Status",
      width: 120,
      cellRenderer: (p: { value: boolean }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            p.value
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {p.value ? "In Stock" : "Out of Stock"}
        </span>
      ),
    },
    { field: "lastUpdated", headerName: "Updated", width: 120 },
  ]);

  const defaultColDef: ColDef<RowData> = {
    sortable: true,
    resizable: true,
  };

  // Send telemetry and update UI
  const sendTelemetryEvent = useCallback((eventType: string, data: unknown) => {
    const event = telemetry.send(eventType, data);
    setTelemetryEvents([...telemetry.events]);
    setStats((prev) => ({ ...prev, totalEvents: telemetry.events.length }));
    return event;
  }, []);

  // Grid ready handler
  const onGridReady = useCallback(
    (params: GridReadyEvent<RowData>) => {
      setGridApi(params.api);

      sendTelemetryEvent("grid_initialized", {
        totalRows: rowData.length,
        columns: colDefs.map((col) => col.field),
        gridVersion: "ag-grid-community",
      });
    },
    [rowData.length, colDefs, sendTelemetryEvent],
  );

  // Extract visible rows
  const extractVisibleRowsData = useCallback(() => {
    if (!gridApi) return;

    const visibleRows: RowData[] = [];
    const firstRow = gridApi.getFirstDisplayedRowIndex();
    const lastRow = gridApi.getLastDisplayedRowIndex();

    for (let i = firstRow; i <= lastRow; i++) {
      const rowNode = gridApi.getDisplayedRowAtIndex(i);
      if (rowNode?.data) {
        visibleRows.push(rowNode.data);
      }
    }

    setStats((prev) => ({ ...prev, visibleRows: visibleRows.length }));

    sendTelemetryEvent("visible_rows_extracted", {
      viewport: {
        firstRowIndex: firstRow,
        lastRowIndex: lastRow,
        visibleRowCount: visibleRows.length,
      },
      visibleRows: visibleRows,
      visibleProductIds: visibleRows.map((r) => r.id),
      totalValue: visibleRows.reduce((sum, r) => sum + r.price * r.quantity, 0),
    });
  }, [gridApi, sendTelemetryEvent]);

  // Extract selected rows
  const extractSelectedRowsData = useCallback(() => {
    if (!gridApi) return;

    const selectedRows = gridApi.getSelectedRows();
    setStats((prev) => ({ ...prev, selectedRows: selectedRows.length }));

    sendTelemetryEvent("selected_rows_extracted", {
      selectedCount: selectedRows.length,
      selectedRows: selectedRows,
      selectedIds: selectedRows.map((row) => row.id),
      totalSelectedValue: selectedRows.reduce(
        (sum, r) => sum + r.price * r.quantity,
        0,
      ),
    });
  }, [gridApi, sendTelemetryEvent]);

  // Extract all grid data with full state
  const extractAllGridData = useCallback(() => {
    if (!gridApi) return;

    const allData: RowData[] = [];
    gridApi.forEachNode((node) => {
      if (node.data) {
        allData.push(node.data);
      }
    });

    const columnState = gridApi.getColumnState();
    const filterModel = gridApi.getFilterModel();

    sendTelemetryEvent("full_grid_state_extracted", {
      gridMetadata: {
        totalRows: allData.length,
        displayedRows: gridApi.getDisplayedRowCount(),
        selectedRows: gridApi.getSelectedRows().length,
      },
      allData: allData,
      columnState: columnState.map((col) => ({
        colId: col.colId,
        width: col.width,
        hide: col.hide,
        sort: col.sort,
        sortIndex: col.sortIndex,
        pinned: col.pinned,
      })),
      activeFilters: filterModel,
      viewport: {
        firstRow: gridApi.getFirstDisplayedRowIndex(),
        lastRow: gridApi.getLastDisplayedRowIndex(),
      },
      aggregations: {
        totalInventoryValue: allData.reduce(
          (sum, r) => sum + r.price * r.quantity,
          0,
        ),
        avgPrice: allData.reduce((sum, r) => sum + r.price, 0) / allData.length,
        inStockCount: allData.filter((r) => r.inStock).length,
        outOfStockCount: allData.filter((r) => !r.inStock).length,
      },
    });
  }, [gridApi, sendTelemetryEvent]);

  // Row selection handler
  const onRowSelected = useCallback(
    (event: RowSelectedEvent<RowData>) => {
      if (event.node.isSelected() && event.data) {
        sendTelemetryEvent("row_selected", {
          rowId: event.data.id,
          rowData: event.data,
          selectionSource: "user_click",
        });
      }

      if (gridApi) {
        setStats((prev) => ({
          ...prev,
          selectedRows: gridApi.getSelectedRows().length,
        }));
      }
    },
    [gridApi, sendTelemetryEvent],
  );

  // Scroll handler with debounce
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onBodyScroll = useCallback(
    (event: BodyScrollEvent) => {
      if (!gridApi) return;

      // Debounce scroll events
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const firstRow = gridApi.getFirstDisplayedRowIndex();
        const lastRow = gridApi.getLastDisplayedRowIndex();

        sendTelemetryEvent("grid_scrolled", {
          scrollDirection: event.direction,
          viewport: {
            firstRow,
            lastRow,
            visibleRowCount: lastRow - firstRow + 1,
          },
          scrollPosition: {
            top: event.top,
            left: event.left,
          },
        });
      }, 300);
    },
    [gridApi, sendTelemetryEvent],
  );

  // Clear telemetry log
  const clearTelemetry = useCallback(() => {
    telemetry.clear();
    setTelemetryEvents([]);
    setStats({ totalEvents: 0, visibleRows: 0, selectedRows: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  AG Grid Telemetry
                </span>
                <span className="text-sm font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded">
                  MCP Demo
                </span>
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Real-time data extraction and telemetry monitoring
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {stats.totalEvents}
                </div>
                <div className="text-xs text-slate-400">Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {stats.visibleRows}
                </div>
                <div className="text-xs text-slate-400">Visible Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {stats.selectedRows}
                </div>
                <div className="text-xs text-slate-400">Selected</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grid Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={extractVisibleRowsData}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
              >
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
                Extract Visible Rows
              </button>

              <button
                onClick={extractSelectedRowsData}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 flex items-center gap-2"
              >
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Extract Selected Rows
              </button>

              <button
                onClick={extractAllGridData}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-amber-500/25 flex items-center gap-2"
              >
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
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
                Extract Full Grid State
              </button>
            </div>

            {/* AG Grid */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
              <div
                className="ag-theme-alpine-dark"
                style={{ height: 500, width: "100%" }}
              >
                <AgGridReact<RowData>
                  ref={gridRef}
                  rowData={rowData}
                  columnDefs={colDefs}
                  defaultColDef={defaultColDef}
                  rowSelection="multiple"
                  onGridReady={onGridReady}
                  onRowSelected={onRowSelected}
                  onBodyScroll={onBodyScroll}
                  animateRows={true}
                  rowHeight={48}
                  headerHeight={48}
                />
              </div>
            </div>

            {/* Info Panel */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                How It Works
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
                    Visible
                  </span>
                  <span>Extracts only rows currently in the viewport</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-medium">
                    Selected
                  </span>
                  <span>Extracts rows selected via checkboxes</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs font-medium">
                    Full State
                  </span>
                  <span>Extracts all data + filters, sorts, column state</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded text-xs font-medium">
                    Auto
                  </span>
                  <span>Scroll & selection events sent automatically</span>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 h-[700px] flex flex-col">
              <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  Telemetry Stream
                </h2>
                <button
                  onClick={clearTelemetry}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-3">
                {telemetryEvents.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <p>Interact with the grid to see telemetry events</p>
                  </div>
                ) : (
                  telemetryEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
