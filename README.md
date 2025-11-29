# AG Grid Telemetry Example

A comprehensive example demonstrating how to extract and send telemetry data from AG Grid in a React application. This project showcases real-time data extraction patterns for monitoring user interactions with data grids.

## Overview

This application demonstrates how to:
- Extract data from **visible rows** in the viewport
- Capture **selected rows** via checkboxes
- Export **complete grid state** including filters, sorts, and column configuration
- Track **user interactions** (scrolling, row selection) automatically
- Send telemetry events to a backend API or analytics platform

## Features

### Data Extraction Methods

1. **Visible Rows Extraction**
   - Get only the rows currently rendered in the viewport
   - Useful for tracking what users are actually viewing
   - Uses `getFirstDisplayedRowIndex()` and `getLastDisplayedRowIndex()`

2. **Selected Rows Extraction**
   - Capture rows selected via checkboxes
   - Perfect for batch operation telemetry
   - Uses `getSelectedRows()`

3. **Full Grid State Extraction**
   - Complete grid state snapshot
   - All row data with filters and sorts
   - Column state (width, visibility, pinning)
   - Aggregated metrics (inventory value, stock counts)

### Automatic Event Tracking

- **Grid Initialization** - Fires when grid is ready
- **Row Selection Events** - Tracks individual row selections
- **Scroll Events** - Debounced scroll tracking (300ms)
- **Real-time Telemetry Panel** - Visual display of all telemetry events

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **AG Grid Community** - Data grid
- **Vite** - Build tool
- **Tailwind CSS 4** - Styling

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

## Usage

The application provides three main buttons for manual data extraction:

- **Send Visible** - Extracts and sends visible rows telemetry
- **Send Selected** - Extracts and sends selected rows telemetry
- **Send Full** - Extracts and sends complete grid state

All events are displayed in real-time in the telemetry panel with:
- Event type and timestamp
- Complete data payload
- Visual animations for new events

## Code Examples

The app includes interactive code examples showing:

1. How to extract visible rows from the viewport
2. How to capture selected rows
3. How to export full grid state with metadata
4. How to implement debounced scroll tracking
5. How to create a telemetry service

Click the tabs in the "Code Examples" section to view implementation details.

## Telemetry Service

The telemetry service is a simple implementation that:
- Creates unique event IDs
- Adds timestamps to all events
- Maintains a rolling buffer of last 50 events
- Logs events to console (can be configured to POST to backend)

To send telemetry to your backend, modify the `send` function in `App.tsx`:

```typescript
// Uncomment and configure for production use
fetch('/api/telemetry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(event),
});
```

## Integration with MCP Servers

This example is perfect for integrating with Model Context Protocol (MCP) servers:

1. Configure the telemetry endpoint to your MCP server
2. Send grid state for AI analysis
3. Use telemetry data for user behavior insights
4. Track data access patterns for compliance

## Project Structure

```
src/
  App.tsx          # Main application with all components
  App.css          # Application styles
  main.tsx         # React entry point
```

All functionality is consolidated in `App.tsx` including:
- Telemetry service
- AG Grid configuration
- Data extraction functions
- Telemetry panel UI
- Code examples display

## License

MIT
