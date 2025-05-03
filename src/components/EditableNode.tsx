'use client';

import React, { useState, useCallback, useEffect, ChangeEvent } from 'react';
import { Handle, Position, NodeProps, useReactFlow, useStoreApi } from 'reactflow';

// Define the expected structure of data, including optional style props
interface EditableNodeData {
  label: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: string; // Use string for flexibility (e.g., '14px', '1em')
}

// Use the defined interface in NodeProps
export default function EditableNode({ id, data, isConnectable }: NodeProps<EditableNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  // Ensure label is initialized correctly even if data.label is initially undefined
  const [label, setLabel] = useState(data.label || '');
  const { setNodes } = useReactFlow();
  const store = useStoreApi();

  // Define default styles
  const defaultStyles = {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    textColor: '#333',
    fontSize: '14px',
  };

  // Update internal label state if data.label changes from outside
  useEffect(() => {
    setLabel(data.label || '');
  }, [data.label]);

  const onDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const onChange = useCallback((evt: ChangeEvent<HTMLTextAreaElement>) => {
    setLabel(evt.target.value);
  }, []);

  const onBlur = useCallback(() => {
    setIsEditing(false);
    const { nodeInternals } = store.getState();
    setNodes(
      Array.from(nodeInternals.values()).map((node) => {
        if (node.id === id) {
          // Update node data including the potentially changed label
          // Keep existing style properties
          node.data = {
             ...node.data, // Preserve existing data, including styles
             label // Update the label
            };
        }
        return node;
      })
    );
  }, [id, label, setNodes, store]);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onBlur();
    }
  }, [onBlur]);

  // Merge data styles with defaults
  const nodeStyles = {
    backgroundColor: data.backgroundColor || defaultStyles.backgroundColor,
    border: `1px solid ${data.borderColor || defaultStyles.borderColor}`,
    color: data.textColor || defaultStyles.textColor,
    fontSize: data.fontSize || defaultStyles.fontSize,
    borderRadius: '8px',
    padding: '10px 15px',
    minWidth: '150px',
    maxWidth: '300px',
    cursor: 'move',
  };

  const textStyles = {
     color: data.textColor || defaultStyles.textColor,
     fontSize: data.fontSize || defaultStyles.fontSize,
     whiteSpace: 'pre-wrap',
     wordBreak: 'break-word'
  } as React.CSSProperties; // Type assertion for CSS properties


  return (
    <div
      onDoubleClick={onDoubleClick}
      style={nodeStyles} // Apply dynamic styles here
    >
      {/* Handles for connecting edges */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} style={{ background: '#555' }} />

      {isEditing ? (
        <textarea
          value={label}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown} // Add keydown handler
          autoFocus // Focus the textarea when it appears
          style={{
            width: '100%',
            padding: '5px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: 'inherit', // Inherit font size from parent div
            fontFamily: 'inherit',
            boxSizing: 'border-box', // Ensure padding is included in width
            minHeight: '50px', // Ensure it's tall enough to type comfortably
            resize: 'vertical', // Allow vertical resizing
            color: '#000', // Keep textarea text black for readability during editing
            // Background could also be set here if needed for editing contrast
          }}
          rows={3} // Start with a reasonable height
        />
      ) : (
        <div style={textStyles}> {/* Apply dynamic text styles here */}
          {label || <span style={{ color: '#aaa' }}>텍스트 입력...</span>}
        </div>
      )}

      {/* Add handles to all sides for flexibility */}
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} style={{ background: '#555' }} />
      <Handle type="source" position={Position.Left} isConnectable={isConnectable} style={{ background: '#555' }}/>
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} style={{ background: '#555' }}/>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} style={{ background: '#555' }}/>
      <Handle type="target" position={Position.Right} isConnectable={isConnectable} style={{ background: '#555' }}/>

    </div>
  );
} 