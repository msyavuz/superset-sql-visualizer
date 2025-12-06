# SQL Query Flow Visualizer

A powerful Apache Superset extension that transforms SQL queries into interactive flow diagrams, helping developers and analysts understand query execution paths and data relationships.

## Features

### 🔍 **Visual Query Analysis**
- **Interactive flow diagrams** showing SQL execution pipeline
- **Proper data flow visualization** - tables → joins → filters → aggregations → results
- **Real-time query parsing** with auto-sync from SQL editor
- **Drag-and-zoom interface** with minimap navigation

### 📊 **Comprehensive SQL Support**
- **Multi-table JOINs** with relationship mapping
- **Common Table Expressions (CTEs)** as reusable components
- **Subqueries** shown as nested data sources
- **UNION/INTERSECT operations** for set combinations
- **Aggregation functions** (COUNT, SUM, AVG, MAX, MIN)
- **Filtering stages** (WHERE/HAVING) in correct execution order
- **Sorting and limiting** (ORDER BY, LIMIT, OFFSET)

### 🎨 **Visual Design**
- **Color-coded nodes** for different SQL operations
- **Animated connections** highlighting data transformations
- **Smart auto-layout** using Dagre algorithm
- **Responsive design** that works in Superset panels

## Installation

1. **Download** the latest `sql_visualizer-0.1.0.supx` file
2. **Install** in Apache Superset:
   - Go to **Settings** → **Extension Management**
   - Click **Install Extension** 
   - Upload the `.supx` file
3. **Activate** the extension in your Superset instance
4. **Access** via SQLLab → **Sql Visualizer** panel

## Usage

### Quick Start
1. Open **SQLLab** in Apache Superset
2. Look for the **"Sql Visualizer"** panel (usually on the right side)
3. **Write SQL** in the main editor or paste into the visualizer textarea
4. **Watch** your query transform into an interactive flow diagram

### Sample Queries
The extension includes built-in sample queries to get you started:

- **Simple SELECT** - Basic table querying with filtering
- **JOIN Query** - Multi-table relationships
- **Complex Aggregation** - GROUP BY with HAVING clauses
- **Multiple JOINs** - Advanced table combining
- **CTE Example** - Common Table Expressions
- **UNION Query** - Set operations

### Interactive Features
- **Auto-sync mode** - Automatically updates from SQL editor
- **Manual refresh** - Update button when auto-sync is disabled
- **Zoom controls** - Pan, zoom, and fit-to-view
- **Node details** - Hover to see query conditions and table info
- **Drag nodes** - Reposition for better layout (connections remain)

## Technical Details

### Architecture
- **Frontend-only extension** (no backend dependencies)
- **React + TypeScript** with ReactFlow for visualization
- **Regex-based SQL parser** for broad compatibility
- **Dagre layout engine** for automatic graph positioning

### Node Types
| Color | Type | Description |
|-------|------|-------------|
| 🟢 Green | **Table** | Data source tables and CTEs |
| 🔵 Blue | **JOIN** | Table joining operations |
| 🟠 Orange | **Filter** | WHERE and HAVING conditions |
| 🟣 Purple | **SELECT** | Column projection and selection |
| 🔷 Cyan | **Group** | GROUP BY aggregation |
| 🟡 Yellow | **Order** | ORDER BY sorting |
| 🟤 Brown | **CTE** | Common Table Expressions |
| 🔴 Red | **Union** | Set operations (UNION/INTERSECT) |
| ⚫ Gray | **Result** | Final query output |

### Data Flow Logic
```
Tables/CTEs → JOINs → WHERE → GROUP BY → Aggregation → HAVING → SELECT → ORDER BY → LIMIT → RESULT
```

## Development

### Building from Source
```bash
# Install dependencies
cd frontend
npm install

# Development mode
npm run start

# Production build
npm run build

# Create extension bundle
superset-extensions bundle
```

### File Structure
```
sql_visualizer/
├── extension.json          # Extension configuration
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── utils/          # SQL parser and layout engine
│   │   └── styles/         # CSS styling
│   └── package.json        # Frontend dependencies
└── README.md
```

## Limitations

- **Regex-based parsing** - May not handle very complex nested queries perfectly
- **Visual complexity** - Very large queries might become cluttered
- **Dialect support** - Optimized for standard SQL, some database-specific features may not be recognized

## Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** with various SQL queries
5. **Submit** a pull request

## License

Licensed under the Apache License 2.0

## Support

For issues, feature requests, or questions:
- **GitHub Issues** - Report bugs and request features
- **Superset Community** - General extension discussion

---

**Transform your SQL understanding with visual query flow diagrams!** 🚀