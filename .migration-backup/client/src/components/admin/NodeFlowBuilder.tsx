import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Play,
  MessageSquare,
  GitBranch,
  ListOrdered,
  Database,
  Bot,
  XCircle,
  Plus,
  Trash2,
  Save,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  GripVertical,
  Settings,
  ChevronRight,
  ArrowRight,
  User,
  PhoneCall,
} from 'lucide-react';

// Node type definitions
export type FlowNodeType = 
  | 'start' 
  | 'message' 
  | 'condition' 
  | 'options' 
  | 'dataRequest' 
  | 'aiResponse' 
  | 'humanHandoff'
  | 'end';

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: FlowNodeType;
  // Message node
  messageText?: string;
  delay?: number;
  // Condition node
  conditionType?: 'contains' | 'equals' | 'startsWith' | 'regex' | 'variable';
  conditionValue?: string;
  variableName?: string;
  // Options node
  options?: Array<{ id: string; text: string; value: string }>;
  // Data request node
  requestType?: 'name' | 'email' | 'phone' | 'custom';
  customFieldLabel?: string;
  saveToVariable?: string;
  validation?: string;
  // AI response node
  aiPrompt?: string;
  useKnowledgeBase?: boolean;
  confidenceThreshold?: number;
  // Human handoff node
  handoffMessage?: string;
  // End node
  endMessage?: string;
  closureType?: 'resolved' | 'unresolved' | 'escalated';
}

// Custom node components
const nodeColors: Record<FlowNodeType, { bg: string; border: string; icon: string }> = {
  start: { bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-500', icon: 'text-green-600' },
  message: { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-500', icon: 'text-blue-600' },
  condition: { bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-500', icon: 'text-amber-600' },
  options: { bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-500', icon: 'text-purple-600' },
  dataRequest: { bg: 'bg-cyan-50 dark:bg-cyan-950', border: 'border-cyan-500', icon: 'text-cyan-600' },
  aiResponse: { bg: 'bg-pink-50 dark:bg-pink-950', border: 'border-pink-500', icon: 'text-pink-600' },
  humanHandoff: { bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-orange-500', icon: 'text-orange-600' },
  end: { bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-500', icon: 'text-red-600' },
};

const nodeIcons: Record<FlowNodeType, typeof Play> = {
  start: Play,
  message: MessageSquare,
  condition: GitBranch,
  options: ListOrdered,
  dataRequest: Database,
  aiResponse: Bot,
  humanHandoff: PhoneCall,
  end: XCircle,
};

interface CustomNodeProps {
  data: FlowNodeData;
  selected: boolean;
  id: string;
}

function StartNode({ data, selected }: CustomNodeProps) {
  const colors = nodeColors.start;
  const Icon = nodeIcons.start;
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${colors.bg} ${colors.border} ${selected ? 'ring-2 ring-primary ring-offset-2' : ''} min-w-[160px]`}>
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded ${colors.icon} bg-green-100 dark:bg-green-900`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm">{data.label || 'Start'}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-green-500 !w-3 !h-3" />
    </div>
  );
}

function MessageNode({ data, selected }: CustomNodeProps) {
  const colors = nodeColors.message;
  const Icon = nodeIcons.message;
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${colors.bg} ${colors.border} ${selected ? 'ring-2 ring-primary ring-offset-2' : ''} min-w-[180px] max-w-[280px]`}>
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${colors.icon} bg-blue-100 dark:bg-blue-900`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm">{data.label || 'Message'}</span>
      </div>
      {data.messageText && (
        <p className="text-xs text-muted-foreground line-clamp-2 pl-8">{data.messageText}</p>
      )}
      <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-3 !h-3" />
    </div>
  );
}

function ConditionNode({ data, selected }: CustomNodeProps) {
  const colors = nodeColors.condition;
  const Icon = nodeIcons.condition;
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${colors.bg} ${colors.border} ${selected ? 'ring-2 ring-primary ring-offset-2' : ''} min-w-[180px]`}>
      <Handle type="target" position={Position.Left} className="!bg-amber-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${colors.icon} bg-amber-100 dark:bg-amber-900`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm">{data.label || 'Condition'}</span>
      </div>
      {data.conditionType && (
        <Badge variant="outline" className="text-xs">{data.conditionType}: {data.conditionValue}</Badge>
      )}
      <div className="flex flex-col gap-1 mt-2">
        <div className="flex items-center justify-end gap-1">
          <span className="text-xs text-green-600">Yes</span>
          <Handle 
            type="source" 
            position={Position.Right} 
            id="yes" 
            className="!bg-green-500 !w-3 !h-3 !relative !transform-none !top-0 !right-0" 
          />
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="text-xs text-red-600">No</span>
          <Handle 
            type="source" 
            position={Position.Right} 
            id="no" 
            className="!bg-red-500 !w-3 !h-3 !relative !transform-none !top-0 !right-0" 
          />
        </div>
      </div>
    </div>
  );
}

function OptionsNode({ data, selected }: CustomNodeProps) {
  const colors = nodeColors.options;
  const Icon = nodeIcons.options;
  const options = data.options || [];
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${colors.bg} ${colors.border} ${selected ? 'ring-2 ring-primary ring-offset-2' : ''} min-w-[200px]`}>
      <Handle type="target" position={Position.Left} className="!bg-purple-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${colors.icon} bg-purple-100 dark:bg-purple-900`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm">{data.label || 'Options Menu'}</span>
      </div>
      <div className="space-y-1 mt-2">
        {options.map((opt, idx) => (
          <div key={opt.id} className="flex items-center justify-between gap-2">
            <span className="text-xs truncate max-w-[120px]">{opt.text || `Option ${idx + 1}`}</span>
            <Handle 
              type="source" 
              position={Position.Right} 
              id={opt.id} 
              className="!bg-purple-500 !w-3 !h-3 !relative !transform-none !top-0 !right-0" 
            />
          </div>
        ))}
        {options.length === 0 && (
          <p className="text-xs text-muted-foreground">No options defined</p>
        )}
      </div>
    </div>
  );
}

function DataRequestNode({ data, selected }: CustomNodeProps) {
  const colors = nodeColors.dataRequest;
  const Icon = nodeIcons.dataRequest;
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${colors.bg} ${colors.border} ${selected ? 'ring-2 ring-primary ring-offset-2' : ''} min-w-[180px]`}>
      <Handle type="target" position={Position.Left} className="!bg-cyan-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${colors.icon} bg-cyan-100 dark:bg-cyan-900`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm">{data.label || 'Data Request'}</span>
      </div>
      <Badge variant="outline" className="text-xs">
        {data.requestType === 'custom' ? data.customFieldLabel : data.requestType || 'Not set'}
      </Badge>
      <Handle type="source" position={Position.Right} className="!bg-cyan-500 !w-3 !h-3" />
    </div>
  );
}

function AIResponseNode({ data, selected }: CustomNodeProps) {
  const colors = nodeColors.aiResponse;
  const Icon = nodeIcons.aiResponse;
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${colors.bg} ${colors.border} ${selected ? 'ring-2 ring-primary ring-offset-2' : ''} min-w-[180px] max-w-[280px]`}>
      <Handle type="target" position={Position.Left} className="!bg-pink-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${colors.icon} bg-pink-100 dark:bg-pink-900`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm">{data.label || 'AI Response'}</span>
      </div>
      <div className="flex items-center gap-2">
        {data.useKnowledgeBase && <Badge variant="secondary" className="text-xs">KB</Badge>}
        {data.confidenceThreshold && <Badge variant="outline" className="text-xs">{data.confidenceThreshold}%</Badge>}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-pink-500 !w-3 !h-3" />
    </div>
  );
}

function HumanHandoffNode({ data, selected }: CustomNodeProps) {
  const colors = nodeColors.humanHandoff;
  const Icon = nodeIcons.humanHandoff;
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${colors.bg} ${colors.border} ${selected ? 'ring-2 ring-primary ring-offset-2' : ''} min-w-[180px]`}>
      <Handle type="target" position={Position.Left} className="!bg-orange-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${colors.icon} bg-orange-100 dark:bg-orange-900`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm">{data.label || 'Human Handoff'}</span>
      </div>
      {data.handoffMessage && (
        <p className="text-xs text-muted-foreground line-clamp-2">{data.handoffMessage}</p>
      )}
      <Handle type="source" position={Position.Right} className="!bg-orange-500 !w-3 !h-3" />
    </div>
  );
}

function EndNode({ data, selected }: CustomNodeProps) {
  const colors = nodeColors.end;
  const Icon = nodeIcons.end;
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${colors.bg} ${colors.border} ${selected ? 'ring-2 ring-primary ring-offset-2' : ''} min-w-[160px]`}>
      <Handle type="target" position={Position.Left} className="!bg-red-500 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded ${colors.icon} bg-red-100 dark:bg-red-900`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm">{data.label || 'End Chat'}</span>
      </div>
      {data.closureType && (
        <Badge variant="outline" className="text-xs mt-2">{data.closureType}</Badge>
      )}
    </div>
  );
}

// Node types registry
const nodeTypes: NodeTypes = {
  start: StartNode,
  message: MessageNode,
  condition: ConditionNode,
  options: OptionsNode,
  dataRequest: DataRequestNode,
  aiResponse: AIResponseNode,
  humanHandoff: HumanHandoffNode,
  end: EndNode,
};

// Node palette items
const paletteNodes: Array<{ type: FlowNodeType; label: string; description: string }> = [
  { type: 'start', label: 'Start', description: 'Conversation entry point' },
  { type: 'message', label: 'Message', description: 'Send a text message' },
  { type: 'condition', label: 'Condition', description: 'Branch based on rules' },
  { type: 'options', label: 'Options Menu', description: 'Show clickable options' },
  { type: 'dataRequest', label: 'Data Request', description: 'Collect user info' },
  { type: 'aiResponse', label: 'AI Response', description: 'Generate AI reply' },
  { type: 'humanHandoff', label: 'Human Handoff', description: 'Transfer to agent' },
  { type: 'end', label: 'End Chat', description: 'Close conversation' },
];

// Settings panel component
interface NodeSettingsPanelProps {
  node: Node<FlowNodeData> | null;
  onUpdate: (nodeId: string, data: Partial<FlowNodeData>) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
}

function NodeSettingsPanel({ node, onUpdate, onClose, onDelete }: NodeSettingsPanelProps) {
  if (!node) return null;

  const data = node.data;
  const nodeType = data.nodeType;

  const updateField = (field: keyof FlowNodeData, value: any) => {
    onUpdate(node.id, { [field]: value });
  };

  const addOption = () => {
    const newOptions = [...(data.options || []), { id: `opt_${Date.now()}`, text: '', value: '' }];
    onUpdate(node.id, { options: newOptions });
  };

  const updateOption = (index: number, field: 'text' | 'value', value: string) => {
    const newOptions = [...(data.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onUpdate(node.id, { options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = (data.options || []).filter((_, i) => i !== index);
    onUpdate(node.id, { options: newOptions });
  };

  return (
    <div className="w-80 border-l bg-background h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span className="font-medium">Node Settings</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Common settings */}
          <div className="space-y-2">
            <Label>Label</Label>
            <Input 
              value={data.label || ''} 
              onChange={(e) => updateField('label', e.target.value)}
              placeholder="Node label"
              data-testid="input-node-label"
            />
          </div>

          <Separator />

          {/* Type-specific settings */}
          {nodeType === 'message' && (
            <>
              <div className="space-y-2">
                <Label>Message Text</Label>
                <Textarea 
                  value={data.messageText || ''} 
                  onChange={(e) => updateField('messageText', e.target.value)}
                  placeholder="Enter your message..."
                  rows={4}
                  data-testid="input-message-text"
                />
              </div>
              <div className="space-y-2">
                <Label>Delay (ms)</Label>
                <Input 
                  type="number"
                  value={data.delay || 0} 
                  onChange={(e) => updateField('delay', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  data-testid="input-message-delay"
                />
              </div>
            </>
          )}

          {nodeType === 'condition' && (
            <>
              <div className="space-y-2">
                <Label>Condition Type</Label>
                <Select 
                  value={data.conditionType || 'contains'} 
                  onValueChange={(v) => updateField('conditionType', v)}
                >
                  <SelectTrigger data-testid="select-condition-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="startsWith">Starts With</SelectItem>
                    <SelectItem value="regex">Regex</SelectItem>
                    <SelectItem value="variable">Variable Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value to Match</Label>
                <Input 
                  value={data.conditionValue || ''} 
                  onChange={(e) => updateField('conditionValue', e.target.value)}
                  placeholder="Enter value..."
                  data-testid="input-condition-value"
                />
              </div>
              {data.conditionType === 'variable' && (
                <div className="space-y-2">
                  <Label>Variable Name</Label>
                  <Input 
                    value={data.variableName || ''} 
                    onChange={(e) => updateField('variableName', e.target.value)}
                    placeholder="e.g., user_email"
                    data-testid="input-variable-name"
                  />
                </div>
              )}
            </>
          )}

          {nodeType === 'options' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                <Button variant="outline" size="sm" onClick={addOption} data-testid="button-add-option">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {(data.options || []).map((opt, idx) => (
                <div key={opt.id} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Option {idx + 1}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => removeOption(idx)}
                      data-testid={`button-remove-option-${idx}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <Input 
                    value={opt.text} 
                    onChange={(e) => updateOption(idx, 'text', e.target.value)}
                    placeholder="Button text"
                    className="text-sm"
                    data-testid={`input-option-text-${idx}`}
                  />
                  <Input 
                    value={opt.value} 
                    onChange={(e) => updateOption(idx, 'value', e.target.value)}
                    placeholder="Value (for conditions)"
                    className="text-sm"
                    data-testid={`input-option-value-${idx}`}
                  />
                </div>
              ))}
            </div>
          )}

          {nodeType === 'dataRequest' && (
            <>
              <div className="space-y-2">
                <Label>Request Type</Label>
                <Select 
                  value={data.requestType || 'name'} 
                  onValueChange={(v) => updateField('requestType', v)}
                >
                  <SelectTrigger data-testid="select-request-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="custom">Custom Field</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {data.requestType === 'custom' && (
                <div className="space-y-2">
                  <Label>Field Label</Label>
                  <Input 
                    value={data.customFieldLabel || ''} 
                    onChange={(e) => updateField('customFieldLabel', e.target.value)}
                    placeholder="e.g., Company Name"
                    data-testid="input-custom-field-label"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Save to Variable</Label>
                <Input 
                  value={data.saveToVariable || ''} 
                  onChange={(e) => updateField('saveToVariable', e.target.value)}
                  placeholder="e.g., user_name"
                  data-testid="input-save-variable"
                />
              </div>
              <div className="space-y-2">
                <Label>Validation (Regex)</Label>
                <Input 
                  value={data.validation || ''} 
                  onChange={(e) => updateField('validation', e.target.value)}
                  placeholder="Optional regex pattern"
                  data-testid="input-validation"
                />
              </div>
            </>
          )}

          {nodeType === 'aiResponse' && (
            <>
              <div className="space-y-2">
                <Label>AI Prompt / Instructions</Label>
                <Textarea 
                  value={data.aiPrompt || ''} 
                  onChange={(e) => updateField('aiPrompt', e.target.value)}
                  placeholder="Instructions for AI response..."
                  rows={4}
                  data-testid="input-ai-prompt"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Use Knowledge Base</Label>
                <Switch 
                  checked={data.useKnowledgeBase || false}
                  onCheckedChange={(v) => updateField('useKnowledgeBase', v)}
                  data-testid="switch-knowledge-base"
                />
              </div>
              <div className="space-y-2">
                <Label>Confidence Threshold (%)</Label>
                <Input 
                  type="number"
                  value={data.confidenceThreshold || 70} 
                  onChange={(e) => updateField('confidenceThreshold', parseInt(e.target.value) || 70)}
                  min={0}
                  max={100}
                  data-testid="input-confidence"
                />
              </div>
            </>
          )}

          {nodeType === 'humanHandoff' && (
            <div className="space-y-2">
              <Label>Handoff Message</Label>
              <Textarea 
                value={data.handoffMessage || ''} 
                onChange={(e) => updateField('handoffMessage', e.target.value)}
                placeholder="Message shown when transferring to agent..."
                rows={3}
                data-testid="input-handoff-message"
              />
            </div>
          )}

          {nodeType === 'end' && (
            <>
              <div className="space-y-2">
                <Label>End Message</Label>
                <Textarea 
                  value={data.endMessage || ''} 
                  onChange={(e) => updateField('endMessage', e.target.value)}
                  placeholder="Final message before closing..."
                  rows={3}
                  data-testid="input-end-message"
                />
              </div>
              <div className="space-y-2">
                <Label>Closure Type</Label>
                <Select 
                  value={data.closureType || 'resolved'} 
                  onValueChange={(v) => updateField('closureType', v)}
                >
                  <SelectTrigger data-testid="select-closure-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="unresolved">Unresolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {nodeType !== 'start' && (
        <div className="p-4 border-t">
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={() => onDelete(node.id)}
            data-testid="button-delete-node"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Node
          </Button>
        </div>
      )}
    </div>
  );
}

// Main flow builder inner component
interface FlowBuilderInnerProps {
  initialNodes?: Node<FlowNodeData>[];
  initialEdges?: Edge[];
  onSave: (nodes: Node<FlowNodeData>[], edges: Edge[]) => void;
  flowName: string;
  onFlowNameChange: (name: string) => void;
}

function FlowBuilderInner({ initialNodes, initialEdges, onSave, flowName, onFlowNameChange }: FlowBuilderInnerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  
  const defaultNodes: Node<FlowNodeData>[] = initialNodes || [
    {
      id: 'start_1',
      type: 'start',
      position: { x: 50, y: 200 },
      data: { label: 'Start', nodeType: 'start' },
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);
  const [selectedNode, setSelectedNode] = useState<Node<FlowNodeData> | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!fullscreenContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      fullscreenContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
        setTimeout(() => fitView(), 100);
      }).catch(console.error);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setTimeout(() => fitView(), 100);
      }).catch(console.error);
    }
  }, [fitView]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
    }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow') as FlowNodeType;
    if (!type) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: Node<FlowNodeData> = {
      id: `${type}_${Date.now()}`,
      type,
      position,
      data: { 
        label: paletteNodes.find(p => p.type === type)?.label || type,
        nodeType: type,
        options: type === 'options' ? [{ id: 'opt_1', text: 'Option 1', value: 'option1' }] : undefined,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [screenToFlowPosition, setNodes]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    setSelectedNode(node);
    setShowSettings(true);
  }, []);

  const updateNodeData = useCallback((nodeId: string, newData: Partial<FlowNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
    if (selectedNode?.id === nodeId) {
      setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, ...newData } } : null);
    }
  }, [setNodes, selectedNode]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
    setShowSettings(false);
  }, [setNodes, setEdges]);

  const handleSave = () => {
    onSave(nodes, edges);
  };

  const onDragStart = (event: React.DragEvent, nodeType: FlowNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div ref={fullscreenContainerRef} className={`flex h-full ${isFullscreen ? 'bg-background' : ''}`}>
      {/* Node Palette */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <Input 
            value={flowName}
            onChange={(e) => onFlowNameChange(e.target.value)}
            placeholder="Flow name..."
            className="font-medium"
            data-testid="input-flow-name"
          />
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Drag nodes to canvas
            </p>
            {paletteNodes.map((item) => {
              const Icon = nodeIcons[item.type];
              const colors = nodeColors[item.type];
              return (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type)}
                  className={`p-3 rounded-lg border-2 ${colors.bg} ${colors.border} cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow`}
                  data-testid={`palette-node-${item.type}`}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div className={`p-1.5 rounded ${colors.icon}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="p-3 border-t">
          <Button onClick={handleSave} className="w-full" data-testid="button-save-flow">
            <Save className="w-4 h-4 mr-2" /> Save Flow
          </Button>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls showInteractive={false} />
          <Panel position="top-right" className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fitView()} title="Fit to view">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <NodeSettingsPanel
          node={selectedNode}
          onUpdate={updateNodeData}
          onClose={() => setShowSettings(false)}
          onDelete={deleteNode}
        />
      )}
    </div>
  );
}

// Main exported component
interface NodeFlowBuilderProps {
  flowId?: number;
  initialData?: {
    name: string;
    nodes: Node<FlowNodeData>[];
    edges: Edge[];
  };
  onSave: (data: { name: string; nodes: Node<FlowNodeData>[]; edges: Edge[] }) => void;
  onCancel: () => void;
}

export function NodeFlowBuilder({ flowId, initialData, onSave, onCancel }: NodeFlowBuilderProps) {
  const [flowName, setFlowName] = useState(initialData?.name || 'New Conversation Flow');

  const handleSave = (nodes: Node<FlowNodeData>[], edges: Edge[]) => {
    onSave({ name: flowName, nodes, edges });
  };

  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} data-testid="button-back">
            <X className="w-4 h-4 mr-1" /> Close
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h2 className="font-semibold">{flowId ? 'Edit Flow' : 'Create New Flow'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Draft</Badge>
        </div>
      </div>
      <div className="flex-1">
        <ReactFlowProvider>
          <FlowBuilderInner
            initialNodes={initialData?.nodes}
            initialEdges={initialData?.edges}
            onSave={handleSave}
            flowName={flowName}
            onFlowNameChange={setFlowName}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export default NodeFlowBuilder;
