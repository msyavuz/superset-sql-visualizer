export interface QueryNode {
  id: string;
  type: 'table' | 'join' | 'filter' | 'select' | 'group' | 'order' | 'limit' | 'subquery' | 'union' | 'cte' | 'aggregate' | 'output';
  label: string;
  data?: any;
  parentId?: string;
}

export interface QueryEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
}

export interface QueryFlow {
  nodes: QueryNode[];
  edges: QueryEdge[];
}

interface TableInfo {
  name: string;
  alias?: string;
  id: string;
}

// Enhanced SQL parser for proper data flow visualization
export const parseQueryToFlow = (sql: string): QueryFlow => {
  const nodes: QueryNode[] = [];
  const edges: QueryEdge[] = [];
  let nodeId = 0;
  
  const getNextId = () => `node-${nodeId++}`;

  try {
    // Normalize SQL for easier parsing
    const normalizedSql = sql
      .replace(/\s+/g, ' ')
      .replace(/\n/g, ' ')
      .trim();

    if (!normalizedSql) {
      throw new Error('Empty query');
    }

    // Extract CTEs (Common Table Expressions)
    const cteMatches = normalizedSql.match(/WITH\s+([\s\S]*?)(?=SELECT)/i);
    const cteNodes: Map<string, string> = new Map();
    
    if (cteMatches) {
      const cteContent = cteMatches[1];
      const ctes = cteContent.split(/,(?![^()]*\))/);
      
      ctes.forEach(cte => {
        const cteMatch = cte.match(/(\w+)\s+AS\s*\(/i);
        if (cteMatch) {
          const cteName = cteMatch[1];
          const cteId = getNextId();
          nodes.push({
            id: cteId,
            type: 'cte',
            label: `CTE: ${cteName}`,
            data: { name: cteName }
          });
          cteNodes.set(cteName.toUpperCase(), cteId);
        }
      });
    }

    // Extract tables from FROM clause FIRST (data sources)
    const fromMatch = normalizedSql.match(/FROM\s+(.*?)(?:\s+(?:LEFT|RIGHT|INNER|FULL|CROSS|JOIN)|WHERE|\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|\s+HAVING|\s*$)/i);
    const tables: TableInfo[] = [];
    let currentDataFlow: string[] = []; // Track current data flow nodes
    
    if (fromMatch) {
      const fromContent = fromMatch[1];
      
      // Check for subquery in FROM
      if (fromContent.includes('(') && fromContent.includes(')')) {
        const subqueryId = getNextId();
        nodes.push({
          id: subqueryId,
          type: 'subquery',
          label: 'SUBQUERY',
          data: { content: fromContent.substring(0, 50) }
        });
        tables.push({ name: 'subquery', id: subqueryId });
        currentDataFlow.push(subqueryId);
      } else {
        // Parse regular tables (handle multiple tables separated by comma)
        const tableMatches = fromContent.match(/([^\s,()]+)(?:\s+(?:AS\s+)?(\w+))?/gi);
        
        if (tableMatches) {
          tableMatches.forEach(tableMatch => {
            const parts = tableMatch.trim().split(/\s+/);
            const tableName = parts[0];
            const alias = parts.length > 1 ? parts[parts.length - 1] : undefined;
            
            // Check if this table is a CTE reference
            if (cteNodes.has(tableName.toUpperCase())) {
              const cteId = cteNodes.get(tableName.toUpperCase())!;
              tables.push({ name: tableName, id: cteId, alias });
              currentDataFlow.push(cteId);
            } else {
              const tableId = getNextId();
              nodes.push({
                id: tableId,
                type: 'table',
                label: alias ? `${tableName} (${alias})` : tableName,
                data: { table: tableName, alias }
              });
              tables.push({ name: tableName, id: tableId, alias });
              currentDataFlow.push(tableId);
            }
          });
        }
      }
    }

    // Extract JOINs - these combine data flows
    const joinPatterns = [
      /(\w+\s+)?JOIN\s+([^\s]+)(?:\s+(?:AS\s+)?(\w+))?\s+ON\s+(.*?)(?=\s+(?:LEFT|RIGHT|INNER|FULL|CROSS|JOIN|WHERE|GROUP|ORDER|LIMIT)|$)/gi
    ];

    joinPatterns.forEach(pattern => {
      const matches = [...normalizedSql.matchAll(pattern)];
      
      matches.forEach((match, index) => {
        const joinType = match[1] ? match[1].trim() : 'INNER';
        const joinTable = match[2];
        const joinAlias = match[3];
        const joinCondition = match[4];
        
        const joinId = getNextId();
        nodes.push({
          id: joinId,
          type: 'join',
          label: `${joinType} JOIN ${joinAlias || joinTable}`,
          data: { 
            table: joinTable, 
            alias: joinAlias, 
            condition: joinCondition,
            joinType 
          }
        });

        // Create table node for joined table or connect to CTE
        let joinedTableId: string;
        if (cteNodes.has(joinTable.toUpperCase())) {
          joinedTableId = cteNodes.get(joinTable.toUpperCase())!;
        } else {
          joinedTableId = getNextId();
          nodes.push({
            id: joinedTableId,
            type: 'table',
            label: joinAlias ? `${joinTable} (${joinAlias})` : joinTable,
            data: { table: joinTable, alias: joinAlias }
          });
        }
        
        // Connect existing data flow to JOIN
        currentDataFlow.forEach(sourceId => {
          edges.push({
            id: `edge-${edges.length}`,
            source: sourceId,
            target: joinId,
            animated: false
          });
        });
        
        // Connect joined table to JOIN
        edges.push({
          id: `edge-${edges.length}`,
          source: joinedTableId,
          target: joinId,
          label: 'JOIN',
          animated: false
        });

        // Update current data flow to just the JOIN result
        currentDataFlow = [joinId];
      });
    });

    // WHERE clause - filters the current data flow
    let currentProcessingNode = currentDataFlow.length > 0 ? currentDataFlow[0] : null;
    
    if (normalizedSql.toUpperCase().includes('WHERE')) {
      const whereId = getNextId();
      const whereMatch = normalizedSql.match(/WHERE\s+(.*?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|\s+HAVING|\s*$)/i);
      const condition = whereMatch ? whereMatch[1].substring(0, 100) : 'conditions';
      
      nodes.push({
        id: whereId,
        type: 'filter',
        label: 'WHERE',
        data: { condition }
      });
      
      // WHERE filters the current data flow
      if (currentProcessingNode) {
        edges.push({
          id: `edge-${edges.length}`,
          source: currentProcessingNode,
          target: whereId,
          animated: false
        });
      }
      currentProcessingNode = whereId;
    }

    // GROUP BY clause
    let groupById: string | null = null;
    if (normalizedSql.toUpperCase().includes('GROUP BY')) {
      groupById = getNextId();
      const groupMatch = normalizedSql.match(/GROUP\s+BY\s+(.*?)(?:\s+HAVING|\s+ORDER\s+BY|\s+LIMIT|\s*$)/i);
      const columns = groupMatch ? groupMatch[1].substring(0, 50) : 'columns';
      
      nodes.push({
        id: groupById,
        type: 'group',
        label: `GROUP BY`,
        data: { columns }
      });
      
      if (currentProcessingNode) {
        edges.push({
          id: `edge-${edges.length}`,
          source: currentProcessingNode,
          target: groupById,
          animated: false
        });
      }
      currentProcessingNode = groupById;
    }

    // Aggregation functions detection
    const aggFunctions = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN'];
    const hasAggregation = aggFunctions.some(func => 
      normalizedSql.toUpperCase().includes(func + '(')
    );
    
    if (hasAggregation) {
      const aggId = getNextId();
      nodes.push({
        id: aggId,
        type: 'aggregate',
        label: 'AGGREGATE',
        data: { functions: aggFunctions.filter(f => normalizedSql.toUpperCase().includes(f + '(')) }
      });
      
      if (currentProcessingNode) {
        edges.push({
          id: `edge-${edges.length}`,
          source: currentProcessingNode,
          target: aggId,
          animated: true
        });
      }
      currentProcessingNode = aggId;
    }

    // HAVING clause (connects after GROUP BY)
    if (normalizedSql.toUpperCase().includes('HAVING')) {
      const havingId = getNextId();
      const havingMatch = normalizedSql.match(/HAVING\s+(.*?)(?:\s+ORDER\s+BY|\s+LIMIT|\s*$)/i);
      const condition = havingMatch ? havingMatch[1].substring(0, 50) : 'condition';
      
      nodes.push({
        id: havingId,
        type: 'filter',
        label: `HAVING`,
        data: { condition, isHaving: true }
      });
      
      if (currentProcessingNode) {
        edges.push({
          id: `edge-${edges.length}`,
          source: currentProcessingNode,
          target: havingId,
          animated: false
        });
      }
      currentProcessingNode = havingId;
    }

    // SELECT node - projects the final columns
    const selectId = getNextId();
    const selectMatch = normalizedSql.match(/SELECT\s+(DISTINCT\s+)?(.*?)(?:\s+FROM|\s*$)/i);
    const selectColumns = selectMatch ? selectMatch[2].substring(0, 100) : '*';
    const isDistinct = selectMatch ? !!selectMatch[1] : false;
    
    nodes.push({
      id: selectId,
      type: 'select',
      label: isDistinct ? 'SELECT DISTINCT' : 'SELECT',
      data: { columns: selectColumns, distinct: isDistinct }
    });

    // Connect current processing to SELECT
    if (currentProcessingNode) {
      edges.push({
        id: `edge-${edges.length}`,
        source: currentProcessingNode,
        target: selectId,
        animated: false
      });
    }
    currentProcessingNode = selectId;

    // ORDER BY clause
    if (normalizedSql.toUpperCase().includes('ORDER BY')) {
      const orderId = getNextId();
      const orderMatch = normalizedSql.match(/ORDER\s+BY\s+(.*?)(?:\s+LIMIT|\s*$)/i);
      const columns = orderMatch ? orderMatch[1].substring(0, 50) : 'columns';
      
      nodes.push({
        id: orderId,
        type: 'order',
        label: `ORDER BY`,
        data: { columns }
      });
      
      if (currentProcessingNode) {
        edges.push({
          id: `edge-${edges.length}`,
          source: currentProcessingNode,
          target: orderId,
          animated: false
        });
      }
      currentProcessingNode = orderId;
    }

    // LIMIT clause
    if (normalizedSql.toUpperCase().includes('LIMIT')) {
      const limitId = getNextId();
      const limitMatch = normalizedSql.match(/LIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?/i);
      const count = limitMatch ? limitMatch[1] : '?';
      const offset = limitMatch && limitMatch[2] ? limitMatch[2] : null;
      
      nodes.push({
        id: limitId,
        type: 'limit',
        label: offset ? `LIMIT ${count} OFFSET ${offset}` : `LIMIT ${count}`,
        data: { count, offset }
      });
      
      if (currentProcessingNode) {
        edges.push({
          id: `edge-${edges.length}`,
          source: currentProcessingNode,
          target: limitId,
          animated: false
        });
      }
      currentProcessingNode = limitId;
    }

    // UNION/INTERSECT/EXCEPT
    const setOperations = ['UNION', 'INTERSECT', 'EXCEPT'];
    setOperations.forEach(op => {
      if (normalizedSql.toUpperCase().includes(` ${op} `)) {
        const unionId = getNextId();
        nodes.push({
          id: unionId,
          type: 'union',
          label: op,
          data: { operation: op }
        });
        
        if (currentProcessingNode) {
          edges.push({
            id: `edge-${edges.length}`,
            source: currentProcessingNode,
            target: unionId,
            animated: true
          });
        }
        
        // Second query would connect here too
        const secondSelectId = getNextId();
        nodes.push({
          id: secondSelectId,
          type: 'select',
          label: 'SELECT (2nd query)',
          data: { isSecondQuery: true }
        });
        
        edges.push({
          id: `edge-${edges.length}`,
          source: secondSelectId,
          target: unionId,
          animated: true
        });
        
        currentProcessingNode = unionId;
      }
    });

    // Add final output node
    const outputId = getNextId();
    nodes.push({
      id: outputId,
      type: 'output',
      label: 'RESULT',
      data: {}
    });
    
    // Connect final processing step to output
    if (currentProcessingNode) {
      edges.push({
        id: `edge-${edges.length}`,
        source: currentProcessingNode,
        target: outputId,
        animated: true
      });
    }

  } catch (error) {
    console.error('SQL parsing error:', error);
    nodes.push({
      id: 'error-node',
      type: 'select',
      label: 'Parse Error',
      data: { error: (error as Error).message }
    });
  }

  // If no nodes were created, show empty state
  if (nodes.length === 0) {
    nodes.push({
      id: 'empty-node',
      type: 'select',
      label: 'Empty Query',
      data: {}
    });
  }

  return { nodes, edges };
};

export const simplifyQuery = (sql: string): string => {
  return sql
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .trim()
    .substring(0, 100);
};