import React, { useCallback, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
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

const createTelemetryService = () => {
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
  isNew?: boolean;
}

const EventCard = ({ event, isNew = false }: EventCardProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Trigger animation when isNew becomes true
  React.useEffect(() => {
    if (isNew) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

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

  const getBorderColor = (type: string): string => {
    const colors: Record<string, string> = {
      grid_initialized: "#10b981",
      visible_rows_extracted: "#3b82f6",
      selected_rows_extracted: "#a855f7",
      full_grid_state_extracted: "#f59e0b",
      row_selected: "#6366f1",
      grid_scrolled: "#64748b",
    };
    return colors[type] || "#6b7280";
  };

  return (
    <div
      ref={cardRef}
      className={`
        bg-slate-800/50 rounded-lg p-3 border transition-all duration-300
        ${
          showAnimation
            ? "border-2"
            : "border border-slate-700/50 hover:border-slate-600"
        }
      `}
      style={
        showAnimation
          ? {
              animation: "eventSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              borderColor: getBorderColor(event.eventType),
              boxShadow: `0 0 20px ${getBorderColor(event.eventType)}40, 0 0 40px ${getBorderColor(event.eventType)}20`,
            }
          : undefined
      }
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-2.5 w-2.5">
          {showAnimation && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getEventColor(event.eventType)}`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getEventColor(event.eventType)}`}
          />
        </span>
        <span className="text-sm font-semibold text-white">
          {event.eventType}
        </span>
        {showAnimation && (
          <span
            className="ml-auto flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: `${getBorderColor(event.eventType)}30`,
              color: getBorderColor(event.eventType),
              animation: "badgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            NEW
          </span>
        )}
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
// TELEMETRY PANEL COMPONENT
// ============================================
interface TelemetryPanelProps {
  telemetryEvents: TelemetryEvent[];
  clearTelemetry: () => void;
  height?: string;
  onExtractVisible?: () => void;
  onExtractSelected?: () => void;
  onExtractAll?: () => void;
}

const TelemetryPanel = ({
  telemetryEvents,
  clearTelemetry,
  height = "h-[700px]",
  onExtractVisible,
  onExtractSelected,
  onExtractAll,
}: TelemetryPanelProps) => {
  const [newestEventId, setNewestEventId] = useState<string | null>(null);
  const prevEventsLengthRef = useRef(0);

  // Track when a new event is added
  React.useEffect(() => {
    if (
      telemetryEvents.length > prevEventsLengthRef.current &&
      telemetryEvents.length > 0
    ) {
      setNewestEventId(telemetryEvents[0].id);
      // Clear the "new" state after animation completes
      const timer = setTimeout(() => setNewestEventId(null), 2500);
      prevEventsLengthRef.current = telemetryEvents.length;
      return () => clearTimeout(timer);
    }
    if (telemetryEvents.length === 0) {
      prevEventsLengthRef.current = 0;
    }
  }, [telemetryEvents]);

  return (
    <div
      className={`bg-slate-800/30 rounded-xl border border-slate-700/50 ${height} flex flex-col`}
    >
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          Telemetry Stream
          {newestEventId && (
            <span
              className="text-amber-400"
              style={{ animation: "bellRing 0.8s ease-in-out" }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </span>
          )}
        </h2>
        <button
          onClick={clearTelemetry}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Action Buttons */}
      {(onExtractVisible || onExtractSelected || onExtractAll) && (
        <div className="p-3 border-b border-slate-700/50 flex flex-wrap gap-2">
          {onExtractVisible && (
            <button
              onClick={onExtractVisible}
              className="flex-1 min-w-[100px] px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
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
              Send Visible
            </button>
          )}
          {onExtractSelected && (
            <button
              onClick={onExtractSelected}
              className="flex-1 min-w-[100px] px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
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
              Send Selected
            </button>
          )}
          {onExtractAll && (
            <button
              onClick={onExtractAll}
              className="flex-1 min-w-[100px] px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-amber-500/25 flex items-center justify-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
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
              Send Full
            </button>
          )}
        </div>
      )}

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
            <p>Click a button above to extract telemetry</p>
          </div>
        ) : (
          telemetryEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isNew={event.id === newestEventId}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ============================================
// CODE EXAMPLES DATA
// ============================================
const codeExamples: Record<
  string,
  { title: string; description: string; code: string }
> = {
  visible: {
    title: "Extract Visible Rows",
    description:
      "Get data from rows currently rendered in the viewport. Useful for tracking what users are actually seeing.",
    code: `// Get the viewport boundaries
const firstRow = gridApi.getFirstDisplayedRowIndex();
const lastRow = gridApi.getLastDisplayedRowIndex();

// Iterate through visible rows
const visibleRows: RowData[] = [];
for (let i = firstRow; i <= lastRow; i++) {
  const rowNode = gridApi.getDisplayedRowAtIndex(i);
  if (rowNode?.data) {
    visibleRows.push(rowNode.data);
  }
}

// Send telemetry with visible data
sendTelemetry('visible_rows_extracted', {
  viewport: { firstRowIndex: firstRow, lastRowIndex: lastRow },
  visibleRows: visibleRows,
  visibleProductIds: visibleRows.map(r => r.id),
});`,
  },
  selected: {
    title: "Extract Selected Rows",
    description:
      "Get data from rows that the user has selected via checkboxes. Perfect for batch operations telemetry.",
    code: `// Get all selected rows in one call
const selectedRows = gridApi.getSelectedRows();

// Send telemetry with selection data
sendTelemetry('selected_rows_extracted', {
  selectedCount: selectedRows.length,
  selectedRows: selectedRows,
  selectedIds: selectedRows.map(row => row.id),
  totalSelectedValue: selectedRows.reduce(
    (sum, r) => sum + (r.price * r.quantity),
    0
  ),
});`,
  },
  fullState: {
    title: "Extract Full Grid State",
    description:
      "Capture complete grid state including all data, column configuration, active filters, and sort order.",
    code: `// Extract all row data
const allData: RowData[] = [];
gridApi.forEachNode(node => {
  if (node.data) {
    allData.push(node.data);
  }
});

// Get column state (widths, visibility, pinning)
const columnState = gridApi.getColumnState();

// Get active filters
const filterModel = gridApi.getFilterModel();

// Send comprehensive telemetry
sendTelemetry('full_grid_state_extracted', {
  gridMetadata: {
    totalRows: allData.length,
    displayedRows: gridApi.getDisplayedRowCount(),
  },
  allData: allData,
  columnState: columnState.map(col => ({
    colId: col.colId,
    width: col.width,
    hide: col.hide,
    sort: col.sort,
    pinned: col.pinned,
  })),
  activeFilters: filterModel,
  viewport: {
    firstRow: gridApi.getFirstDisplayedRowIndex(),
    lastRow: gridApi.getLastDisplayedRowIndex(),
  },
});`,
  },
  scroll: {
    title: "Track Scroll Events",
    description:
      "Monitor user scrolling behavior with debounced events to avoid flooding your telemetry pipeline.",
    code: `// Debounce scroll events to avoid spam
const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const onBodyScroll = useCallback((event: BodyScrollEvent) => {
  if (!gridApi) return;

  // Clear previous timeout
  if (scrollTimeoutRef.current) {
    clearTimeout(scrollTimeoutRef.current);
  }

  // Debounce: wait 300ms after scrolling stops
  scrollTimeoutRef.current = setTimeout(() => {
    const firstRow = gridApi.getFirstDisplayedRowIndex();
    const lastRow = gridApi.getLastDisplayedRowIndex();

    sendTelemetry('grid_scrolled', {
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
}, [gridApi]);

// Attach to AgGridReact
<AgGridReact onBodyScroll={onBodyScroll} />`,
  },
  telemetry: {
    title: "Telemetry Service",
    description:
      "A simple telemetry service that batches events and sends them to your backend API.",
    code: `interface TelemetryEvent {
  id: string;
  eventType: string;
  timestamp: string;
  data: unknown;
}

const createTelemetryService = () => {
  const events: TelemetryEvent[] = [];

  return {
    events,

    send: (eventType: string, data: unknown) => {
      const event: TelemetryEvent = {
        id: crypto.randomUUID(),
        eventType,
        timestamp: new Date().toISOString(),
        data,
      };

      events.unshift(event);
      console.log('📊 Telemetry:', event);

      // Send to backend
      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      return event;
    },

    flush: async () => {
      // Batch send all queued events
      await fetch('/api/telemetry/batch', {
        method: 'POST',
        body: JSON.stringify({ events }),
      });
    },
  };
};`,
  },
};

// ============================================
// CODE EXAMPLES SECTION COMPONENT
// ============================================
interface CodeExamplesSectionProps {
  activeExample: string;
  setActiveExample: (example: string) => void;
}

const CodeExamplesSection = ({
  activeExample,
  setActiveExample,
}: CodeExamplesSectionProps) => {
  const tabs = [
    { id: "visible", label: "Visible Rows", color: "blue" },
    { id: "selected", label: "Selected Rows", color: "purple" },
    { id: "fullState", label: "Full State", color: "amber" },
    { id: "scroll", label: "Scroll Events", color: "slate" },
    { id: "telemetry", label: "Telemetry Service", color: "emerald" },
  ];

  const example = codeExamples[activeExample];

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg
            className="w-5 h-5 text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          Code Examples
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          See how data extraction is implemented in the codebase
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-3 bg-slate-900/30 border-b border-slate-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveExample(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeExample === tab.id
                ? `bg-${tab.color}-500/20 text-${tab.color}-400 ring-1 ring-${tab.color}-500/50`
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
            style={
              activeExample === tab.id
                ? {
                    backgroundColor:
                      tab.color === "blue"
                        ? "rgba(59, 130, 246, 0.2)"
                        : tab.color === "purple"
                          ? "rgba(168, 85, 247, 0.2)"
                          : tab.color === "amber"
                            ? "rgba(245, 158, 11, 0.2)"
                            : tab.color === "slate"
                              ? "rgba(100, 116, 139, 0.2)"
                              : "rgba(16, 185, 129, 0.2)",
                    color:
                      tab.color === "blue"
                        ? "rgb(96, 165, 250)"
                        : tab.color === "purple"
                          ? "rgb(192, 132, 252)"
                          : tab.color === "amber"
                            ? "rgb(251, 191, 36)"
                            : tab.color === "slate"
                              ? "rgb(148, 163, 184)"
                              : "rgb(52, 211, 153)",
                  }
                : {}
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <h4 className="text-white font-semibold">{example.title}</h4>
          <p className="text-sm text-slate-400 mt-1">{example.description}</p>
        </div>

        {/* Code Block */}
        <div className="relative">
          <pre className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-80 text-sm">
            <code className="text-slate-300 font-mono whitespace-pre">
              {example.code.split("\n").map((line, i) => (
                <div key={i} className="flex">
                  <span className="text-slate-600 select-none w-8 text-right pr-4 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span>{highlightCode(line)}</span>
                </div>
              ))}
            </code>
          </pre>

          {/* Copy button */}
          <button
            onClick={() => navigator.clipboard.writeText(example.code)}
            className="absolute top-2 right-2 p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
            title="Copy code"
          >
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple syntax highlighting helper
const highlightCode = (line: string): React.ReactNode => {
  // Highlight comments
  if (line.trim().startsWith("//")) {
    return <span className="text-slate-500">{line}</span>;
  }

  // Create spans for different syntax elements
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;

  // Simple regex-based highlighting
  const regex =
    /(\b(?:const|let|var|function|return|if|for|await|async|useCallback|useRef|interface|type)\b)|(\b(?:string|number|boolean|RowData|TelemetryEvent|GridApi|null)\b)|(\/\/.*$)|('.*?'|".*?")|(\d+)/g;

  let match;
  while ((match = regex.exec(line)) !== null) {
    // Add text before match
    if (match.index > currentIndex) {
      parts.push(line.slice(currentIndex, match.index));
    }

    if (match[1]) {
      // Keyword
      parts.push(
        <span key={match.index} className="text-purple-400">
          {match[0]}
        </span>,
      );
    } else if (match[2]) {
      // Type
      parts.push(
        <span key={match.index} className="text-cyan-400">
          {match[0]}
        </span>,
      );
    } else if (match[3]) {
      // Comment
      parts.push(
        <span key={match.index} className="text-slate-500">
          {match[0]}
        </span>,
      );
    } else if (match[4]) {
      // String
      parts.push(
        <span key={match.index} className="text-emerald-400">
          {match[0]}
        </span>,
      );
    } else if (match[5]) {
      // Number
      parts.push(
        <span key={match.index} className="text-amber-400">
          {match[0]}
        </span>,
      );
    }

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < line.length) {
    parts.push(line.slice(currentIndex));
  }

  return parts.length > 0 ? <>{parts}</> : line;
};

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  const gridRef = useRef<AgGridReact<RowData>>(null);
  const [gridApi, setGridApi] = useState<GridApi<RowData> | null>(null);
  const [rowData] = useState<RowData[]>(generateSampleData);
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);
  const [activeCodeExample, setActiveCodeExample] = useState<string>("visible");
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
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      {/* Global CSS Animations for Telemetry */}
      <style>{`
        @keyframes eventSlideIn {
          0% {
            opacity: 0;
            transform: translateX(-30px) scale(0.9);
          }
          50% {
            transform: translateX(5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes badgePop {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-14deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-10deg); }
          50% { transform: rotate(6deg); }
          60% { transform: rotate(-6deg); }
          70% { transform: rotate(2deg); }
          80% { transform: rotate(-2deg); }
          90% { transform: rotate(0deg); }
        }
      `}</style>

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
        {/* Desktop: 3-column layout with sidebar | Mobile: single column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Grid */}
          <div className="lg:col-span-2 space-y-4">
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

            {/* Telemetry Panel - Mobile Only (visible on mobile, hidden on desktop) */}
            <div className="lg:hidden">
              <TelemetryPanel
                telemetryEvents={telemetryEvents}
                clearTelemetry={clearTelemetry}
                height="h-[400px]"
                onExtractVisible={extractVisibleRowsData}
                onExtractSelected={extractSelectedRowsData}
                onExtractAll={extractAllGridData}
              />
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

            {/* Code Examples Section */}
            <CodeExamplesSection
              activeExample={activeCodeExample}
              setActiveExample={setActiveCodeExample}
            />
          </div>

          {/* Right Column - Telemetry Panel (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <TelemetryPanel
                telemetryEvents={telemetryEvents}
                clearTelemetry={clearTelemetry}
                height="h-[700px]"
                onExtractVisible={extractVisibleRowsData}
                onExtractSelected={extractSelectedRowsData}
                onExtractAll={extractAllGridData}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
