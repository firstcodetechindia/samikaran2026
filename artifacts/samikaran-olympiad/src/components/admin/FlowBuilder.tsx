import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Play, MessageSquare, HelpCircle, GitBranch, Database, Bot, 
  XCircle, Plus, Trash2, Save, ArrowLeft, Settings2, Loader2,
  CheckCircle, List, FileText
} from "lucide-react";

interface FlowNode {
  id: string;
  type: "start" | "message" | "options" | "data_request" | "condition" | "ai_response" | "end";
  position: { x: number; y: number };
  config: {
    message?: string;
    options?: { id: string; label: string; nextNodeId?: string }[];
    dataFields?: { id: string; field: string; label: string; required: boolean }[];
    conditionField?: string;
    conditionOperator?: string;
    conditionValue?: string;
  };
}

interface FlowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  optionId?: string;
}

interface FlowBuilderProps {
  flowId: number | null;
  flowName: string;
  onBack: () => void;
}

const NODE_TYPES = [
  { type: "start", label: "Start", icon: Play, color: "bg-green-500" },
  { type: "message", label: "Message", icon: MessageSquare, color: "bg-blue-500" },
  { type: "options", label: "Options Menu", icon: List, color: "bg-purple-500" },
  { type: "data_request", label: "Data Request", icon: Database, color: "bg-orange-500" },
  { type: "condition", label: "Condition", icon: GitBranch, color: "bg-yellow-500" },
  { type: "ai_response", label: "AI Response", icon: Bot, color: "bg-pink-500" },
  { type: "end", label: "End Chat", icon: XCircle, color: "bg-red-500" },
];

export default function FlowBuilder({ flowId, flowName, onBack }: FlowBuilderProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [connecting, setConnecting] = useState<{ nodeId: string; optionId?: string } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showNodeEditor, setShowNodeEditor] = useState(false);

  const { data: flowData, isLoading } = useQuery<{ nodes: FlowNode[]; edges: FlowEdge[] }>({
    queryKey: ["/api/admin/chatbot/flows", flowId, "nodes"],
    enabled: !!flowId,
  });

  useEffect(() => {
    if (flowData) {
      setNodes(flowData.nodes || []);
      setEdges(flowData.edges || []);
    } else if (!flowId) {
      setNodes([{
        id: `node_${Date.now()}`,
        type: "start",
        position: { x: 100, y: 100 },
        config: { message: "Welcome! How can I help you today?" }
      }]);
    }
  }, [flowData, flowId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/admin/chatbot/flows/${flowId}/nodes`, { nodes, edges });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/flows"] });
      toast({ title: "Flow saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save flow", variant: "destructive" });
    },
  });

  const addNode = (type: FlowNode["type"]) => {
    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      type,
      position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
      config: getDefaultConfig(type),
    };
    setNodes([...nodes, newNode]);
  };

  const getDefaultConfig = (type: FlowNode["type"]) => {
    switch (type) {
      case "start":
        return { message: "Help us serve you better!\n\nPlease select the option that best describes your request:" };
      case "message":
        return { message: "Enter your message here..." };
      case "options":
        return {
          message: "Please choose an option:",
          options: [
            { id: `opt_${Date.now()}_1`, label: "Business Inquiry", nextNodeId: undefined },
            { id: `opt_${Date.now()}_2`, label: "Educational Help", nextNodeId: undefined },
            { id: `opt_${Date.now()}_3`, label: "General Query", nextNodeId: undefined },
          ]
        };
      case "data_request":
        return {
          message: "Could you please provide some details?",
          dataFields: [
            { id: `field_${Date.now()}_1`, field: "name", label: "Your Name", required: true },
          ]
        };
      case "condition":
        return { conditionField: "", conditionOperator: "equals", conditionValue: "" };
      case "ai_response":
        return { message: "Let me help you with that..." };
      case "end":
        return { message: "Thank you for chatting with us. Have a great day!" };
      default:
        return {};
    }
  };

  const updateNodePosition = (nodeId: string, position: { x: number; y: number }) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, position } : n));
  };

  const updateNodeConfig = (nodeId: string, config: FlowNode["config"]) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, config } : n));
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, config });
    }
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
      setShowNodeEditor(false);
    }
  };

  const addEdge = (targetId: string) => {
    if (!connecting) return;
    
    const existingEdge = edges.find(e => 
      e.sourceId === connecting.nodeId && 
      (connecting.optionId ? e.optionId === connecting.optionId : !e.optionId)
    );
    
    if (existingEdge) {
      setEdges(edges.map(e => e.id === existingEdge.id ? { ...e, targetId } : e));
    } else {
      const newEdge: FlowEdge = {
        id: `edge_${Date.now()}`,
        sourceId: connecting.nodeId,
        targetId,
        optionId: connecting.optionId,
      };
      setEdges([...edges, newEdge]);
    }
    
    if (connecting.optionId) {
      const sourceNode = nodes.find(n => n.id === connecting.nodeId);
      if (sourceNode?.config.options) {
        updateNodeConfig(connecting.nodeId, {
          ...sourceNode.config,
          options: sourceNode.config.options.map(opt => 
            opt.id === connecting.optionId ? { ...opt, nextNodeId: targetId } : opt
          )
        });
      }
    }
    
    setConnecting(null);
  };

  const handleNodeDragStart = (e: React.MouseEvent, node: FlowNode) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleNodeDrag = (e: React.MouseEvent, nodeId: string) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;
    updateNodePosition(nodeId, { x: Math.max(0, x), y: Math.max(0, y) });
  };

  const getNodeIcon = (type: FlowNode["type"]) => {
    const nodeType = NODE_TYPES.find(n => n.type === type);
    return nodeType?.icon || MessageSquare;
  };

  const getNodeColor = (type: FlowNode["type"]) => {
    const nodeType = NODE_TYPES.find(n => n.type === type);
    return nodeType?.color || "bg-gray-500";
  };

  const renderEdges = () => {
    return edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.sourceId);
      const targetNode = nodes.find(n => n.id === edge.targetId);
      if (!sourceNode || !targetNode) return null;

      const sourceX = sourceNode.position.x + 140;
      const sourceY = sourceNode.position.y + 40;
      const targetX = targetNode.position.x;
      const targetY = targetNode.position.y + 40;

      const midX = (sourceX + targetX) / 2;
      const path = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;

      return (
        <svg key={edge.id} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground/50"
          />
          <circle cx={targetX} cy={targetY} r="4" className="fill-primary" />
        </svg>
      );
    });
  };

  const renderNodeEditor = () => {
    if (!selectedNode) return null;

    return (
      <Dialog open={showNodeEditor} onOpenChange={setShowNodeEditor}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {(() => { const Icon = getNodeIcon(selectedNode.type); return <Icon className="w-5 h-5" />; })()}
              Edit {NODE_TYPES.find(n => n.type === selectedNode.type)?.label}
            </DialogTitle>
            <DialogDescription>Configure this node's behavior and content</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-4">
            {(selectedNode.type === "start" || selectedNode.type === "message" || selectedNode.type === "ai_response" || selectedNode.type === "end") && (
              <div>
                <Label>Message</Label>
                <Textarea
                  value={selectedNode.config.message || ""}
                  onChange={(e) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, message: e.target.value })}
                  className="mt-1 min-h-[100px]"
                  placeholder="Enter the message to display..."
                  data-testid="textarea-node-message"
                />
              </div>
            )}

            {selectedNode.type === "options" && (
              <>
                <div>
                  <Label>Menu Title</Label>
                  <Textarea
                    value={selectedNode.config.message || ""}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, message: e.target.value })}
                    className="mt-1"
                    placeholder="Please choose an option:"
                    data-testid="textarea-options-title"
                  />
                </div>
                <div>
                  <Label>Options</Label>
                  <div className="space-y-2 mt-2">
                    {selectedNode.config.options?.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <Input
                          value={opt.label}
                          onChange={(e) => {
                            const newOptions = [...(selectedNode.config.options || [])];
                            newOptions[idx] = { ...opt, label: e.target.value };
                            updateNodeConfig(selectedNode.id, { ...selectedNode.config, options: newOptions });
                          }}
                          placeholder="Option label"
                          data-testid={`input-option-${idx}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const newOptions = selectedNode.config.options?.filter((_, i) => i !== idx);
                            updateNodeConfig(selectedNode.id, { ...selectedNode.config, options: newOptions });
                          }}
                          data-testid={`button-delete-option-${idx}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOption = { id: `opt_${Date.now()}`, label: "New Option", nextNodeId: undefined };
                        updateNodeConfig(selectedNode.id, {
                          ...selectedNode.config,
                          options: [...(selectedNode.config.options || []), newOption]
                        });
                      }}
                      data-testid="button-add-option"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Option
                    </Button>
                  </div>
                </div>
              </>
            )}

            {selectedNode.type === "data_request" && (
              <>
                <div>
                  <Label>Request Message</Label>
                  <Textarea
                    value={selectedNode.config.message || ""}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, message: e.target.value })}
                    className="mt-1"
                    placeholder="Could you please provide some details?"
                    data-testid="textarea-data-request-message"
                  />
                </div>
                <div>
                  <Label>Data Fields</Label>
                  <div className="space-y-2 mt-2">
                    {selectedNode.config.dataFields?.map((field, idx) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <Select
                          value={field.field}
                          onValueChange={(v) => {
                            const newFields = [...(selectedNode.config.dataFields || [])];
                            newFields[idx] = { ...field, field: v, label: v.charAt(0).toUpperCase() + v.slice(1) };
                            updateNodeConfig(selectedNode.id, { ...selectedNode.config, dataFields: newFields });
                          }}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-field-type-${idx}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="query">Query</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={field.label}
                          onChange={(e) => {
                            const newFields = [...(selectedNode.config.dataFields || [])];
                            newFields[idx] = { ...field, label: e.target.value };
                            updateNodeConfig(selectedNode.id, { ...selectedNode.config, dataFields: newFields });
                          }}
                          placeholder="Label"
                          className="flex-1"
                          data-testid={`input-field-label-${idx}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const newFields = selectedNode.config.dataFields?.filter((_, i) => i !== idx);
                            updateNodeConfig(selectedNode.id, { ...selectedNode.config, dataFields: newFields });
                          }}
                          data-testid={`button-delete-field-${idx}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newField = { id: `field_${Date.now()}`, field: "name", label: "Name", required: true };
                        updateNodeConfig(selectedNode.id, {
                          ...selectedNode.config,
                          dataFields: [...(selectedNode.config.dataFields || []), newField]
                        });
                      }}
                      data-testid="button-add-field"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Field
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowNodeEditor(false)} data-testid="button-close-node-editor">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-flows">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="text-xl font-semibold">{flowName}</h3>
            <p className="text-sm text-muted-foreground">Drag nodes to design your conversation flow</p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-flow">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Flow
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Node Palette</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {NODE_TYPES.map(nodeType => (
                <Button
                  key={nodeType.type}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => addNode(nodeType.type as FlowNode["type"])}
                  data-testid={`button-add-${nodeType.type}`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${nodeType.color}`}>
                    <nodeType.icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs">{nodeType.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-10">
          <Card className="overflow-hidden">
            <div
              ref={canvasRef}
              className="relative h-[600px] bg-muted/30 overflow-auto"
              style={{ backgroundImage: "radial-gradient(circle, hsl(var(--muted-foreground)/0.2) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
              onClick={() => {
                if (connecting) setConnecting(null);
              }}
              data-testid="flow-canvas"
            >
              {renderEdges()}
              
              {nodes.map(node => {
                const Icon = getNodeIcon(node.type);
                const color = getNodeColor(node.type);
                
                return (
                  <motion.div
                    key={node.id}
                    className={`absolute cursor-move select-none ${selectedNode?.id === node.id ? "ring-2 ring-primary" : ""}`}
                    style={{ left: node.position.x, top: node.position.y, zIndex: 10 }}
                    drag
                    dragMomentum={false}
                    onDragStart={(e) => handleNodeDragStart(e as unknown as React.MouseEvent, node)}
                    onDrag={(e) => handleNodeDrag(e as unknown as React.MouseEvent, node.id)}
                    onDragEnd={(_, info) => {
                      updateNodePosition(node.id, {
                        x: node.position.x + info.offset.x,
                        y: node.position.y + info.offset.y
                      });
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (connecting) {
                        addEdge(node.id);
                      } else {
                        setSelectedNode(node);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                      setShowNodeEditor(true);
                    }}
                    data-testid={`flow-node-${node.id}`}
                  >
                    <Card className="w-56 shadow-lg">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${color}`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">
                                {NODE_TYPES.find(n => n.type === node.type)?.label}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {node.config.message?.substring(0, 30) || "Configure..."}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNode(node);
                                setShowNodeEditor(true);
                              }}
                              data-testid={`button-edit-node-${node.id}`}
                            >
                              <Settings2 className="w-3 h-3" />
                            </Button>
                            {node.type !== "start" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNode(node.id);
                                }}
                                data-testid={`button-delete-node-${node.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {node.type === "options" && node.config.options && (
                          <div className="mt-2 space-y-1">
                            {node.config.options.map(opt => (
                              <div
                                key={opt.id}
                                className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50 hover:bg-muted cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConnecting({ nodeId: node.id, optionId: opt.id });
                                }}
                                data-testid={`option-${opt.id}`}
                              >
                                <span className="truncate">{opt.label}</span>
                                <div className={`w-2 h-2 rounded-full ${opt.nextNodeId ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                              </div>
                            ))}
                          </div>
                        )}

                        {(node.type === "message" || node.type === "start" || node.type === "data_request" || node.type === "ai_response") && (
                          <div className="mt-2 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className={`h-6 text-xs ${connecting?.nodeId === node.id ? "ring-2 ring-primary" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConnecting({ nodeId: node.id });
                              }}
                              data-testid={`button-connect-${node.id}`}
                            >
                              Connect →
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {connecting && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg z-50">
                  Click on a node to connect • Press Escape to cancel
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {renderNodeEditor()}
    </div>
  );
}
