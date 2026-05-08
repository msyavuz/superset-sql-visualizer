import React, { useState, useEffect } from 'react';
import QueryFlowDiagram from './QueryFlowDiagram';
import '../styles/SqlVisualizer.css';

const SqlVisualizerPanel: React.FC = () => {
  const [currentSql, setCurrentSql] = useState<string>('');
  const [isAutoUpdate, setIsAutoUpdate] = useState<boolean>(true);

  useEffect(() => {
    const handleSqlChange = (event: CustomEvent) => {
      if (isAutoUpdate && event.detail?.sql) {
        setCurrentSql(event.detail.sql);
      }
    };

    const handleEditorChange = () => {
      if (isAutoUpdate) {
        try {
          const editor = document.querySelector('.ace_editor');
          if (editor) {
            const aceEditor = (editor as any).env?.editor;
            if (aceEditor) {
              const sql = aceEditor.getValue();
              setCurrentSql(sql);
            }
          }
        } catch (error) {
          console.error('Failed to get SQL from editor:', error);
        }
      }
    };

    window.addEventListener('sqllab:sql-change', handleSqlChange as EventListener);
    
    const interval = setInterval(handleEditorChange, 1000);
    
    handleEditorChange();

    return () => {
      window.removeEventListener('sqllab:sql-change', handleSqlChange as EventListener);
      clearInterval(interval);
    };
  }, [isAutoUpdate]);

  const handleManualUpdate = () => {
    try {
      const editor = document.querySelector('.ace_editor');
      if (editor) {
        const aceEditor = (editor as any).env?.editor;
        if (aceEditor) {
          const sql = aceEditor.getValue();
          setCurrentSql(sql);
        }
      }
    } catch (error) {
      console.error('Failed to get SQL from editor:', error);
    }
  };

  const sampleQueries = [
    {
      name: 'Simple SELECT',
      sql: 'SELECT * FROM users WHERE age > 18 ORDER BY name LIMIT 10'
    },
    {
      name: 'JOIN Query',
      sql: 'SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id WHERE o.status = "completed"'
    },
    {
      name: 'Complex Aggregation',
      sql: `SELECT 
        department,
        COUNT(*) as employee_count,
        AVG(salary) as avg_salary
      FROM employees
      WHERE hire_date > '2020-01-01'
      GROUP BY department
      HAVING COUNT(*) > 5
      ORDER BY avg_salary DESC
      LIMIT 10`
    },
    {
      name: 'Multiple JOINs',
      sql: `SELECT u.name, p.title, c.name as company 
      FROM users u 
      JOIN profiles p ON u.id = p.user_id 
      LEFT JOIN companies c ON p.company_id = c.id 
      WHERE u.active = 1`
    },
    {
      name: 'CTE Example',
      sql: `WITH recent_orders AS (
        SELECT customer_id, SUM(total) as total_spent
        FROM orders 
        WHERE order_date > '2024-01-01'
        GROUP BY customer_id
      )
      SELECT c.name, ro.total_spent
      FROM customers c
      JOIN recent_orders ro ON c.id = ro.customer_id
      ORDER BY ro.total_spent DESC`
    },
    {
      name: 'UNION Query',
      sql: `SELECT 'current' as type, name, email FROM current_users
      UNION
      SELECT 'archived' as type, name, email FROM archived_users
      ORDER BY name`
    }
  ];

  return (
    <div style={{ 
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'white'
    }}>
      <div style={{ 
        marginBottom: '20px',
        borderBottom: '1px solid #e0e0e0',
        paddingBottom: '15px'
      }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', fontWeight: 'bold' }}>
          SQL Query Flow Visualization
        </h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              checked={isAutoUpdate}
              onChange={(e) => setIsAutoUpdate(e.target.checked)}
            />
            Auto-update from editor
          </label>
          
          {!isAutoUpdate && (
            <button
              onClick={handleManualUpdate}
              style={{
                padding: '5px 15px',
                background: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Update from Editor
            </button>
          )}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <span style={{ marginRight: '10px', fontSize: '14px' }}>Sample Queries:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
            {sampleQueries.map((sample, index) => (
              <button
                key={index}
                onClick={() => setCurrentSql(sample.sql)}
                style={{
                  padding: '4px 12px',
                  background: '#f0f0f0',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e0e0e0';
                  e.currentTarget.style.borderColor = '#1890ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f0f0f0';
                  e.currentTarget.style.borderColor = '#d0d0d0';
                }}
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <textarea
            value={currentSql}
            onChange={(e) => setCurrentSql(e.target.value)}
            placeholder="Paste or type SQL query here..."
            style={{
              width: '100%',
              height: '80px',
              padding: '8px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '13px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>Legend:</strong>{' '}
          <span style={{ background: '#4CAF50', color: 'white', padding: '2px 6px', borderRadius: '3px', marginRight: '5px' }}>Table</span>
          <span style={{ background: '#2196F3', color: 'white', padding: '2px 6px', borderRadius: '3px', marginRight: '5px' }}>Join</span>
          <span style={{ background: '#FF9800', color: 'white', padding: '2px 6px', borderRadius: '3px', marginRight: '5px' }}>Filter</span>
          <span style={{ background: '#9C27B0', color: 'white', padding: '2px 6px', borderRadius: '3px', marginRight: '5px' }}>Select</span>
          <span style={{ background: '#00BCD4', color: 'white', padding: '2px 6px', borderRadius: '3px', marginRight: '5px' }}>Group</span>
          <span style={{ background: '#CDDC39', color: 'black', padding: '2px 6px', borderRadius: '3px', marginRight: '5px' }}>Order</span>
          <span style={{ background: '#FFC107', color: 'black', padding: '2px 6px', borderRadius: '3px' }}>Limit</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <QueryFlowDiagram sql={currentSql} />
      </div>
    </div>
  );
};

export default SqlVisualizerPanel;