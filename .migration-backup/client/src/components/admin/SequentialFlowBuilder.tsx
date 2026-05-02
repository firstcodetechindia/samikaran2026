import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Play, MessageSquare, Database, Bot, XCircle, Plus, Trash2, Save, 
  ArrowLeft, Loader2, ChevronRight, Settings2, GitBranch, Sparkles,
  User, Tag, Webhook, Link2, MoreHorizontal, GripVertical, X
} from "lucide-react";

interface FlowStep {
  id: string;
  type: "start" | "message" | "get_user_details" | "action" | "condition" | "ai_response" | "api_call" | "flow_connector" | "end";
  config: StepConfig;
  order: number;
}

interface StepConfig {
  message?: string;
  userFields?: UserField[];
  actions?: ActionItem[];
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: string;
  trueBranch?: string;
  falseBranch?: string;
  apiEndpoint?: string;
  apiMethod?: string;
  connectedFlowId?: number;
}

interface UserField {
  id: string;
  fieldType: string;
  label: string;
  required: boolean;
}

interface ActionItem {
  id: string;
  actionType: string;
  value: string;
}

interface SequentialFlowBuilderProps {
  flowId: number | null;
  flowName: string;
  onBack: () => void;
}

const STEP_TYPES = [
  { 
    category: "Messages",
    items: [
      { type: "message", label: "Message", icon: MessageSquare, color: "bg-blue-500", description: "Send a text message" },
    ]
  },
  {
    category: "Data Collection",
    items: [
      { type: "get_user_details", label: "Get User Details", icon: User, color: "bg-emerald-500", description: "Collect user information" },
    ]
  },
  {
    category: "Logic",
    items: [
      { type: "condition", label: "Condition", icon: GitBranch, color: "bg-amber-500", description: "Branch based on conditions" },
      { type: "ai_response", label: "AI Response", icon: Sparkles, color: "bg-purple-500", description: "Generate AI-powered response" },
    ]
  },
  {
    category: "Actions",
    items: [
      { type: "action", label: "Action", icon: Tag, color: "bg-pink-500", description: "Assign tags, set data" },
      { type: "api_call", label: "REST API", icon: Webhook, color: "bg-orange-500", description: "Call external API" },
      { type: "flow_connector", label: "Flow Connector", icon: Link2, color: "bg-cyan-500", description: "Jump to another flow" },
    ]
  },
  {
    category: "End",
    items: [
      { type: "end", label: "End Chat", icon: XCircle, color: "bg-red-500", description: "End the conversation" },
    ]
  }
];

const USER_FIELD_TYPES = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone Number" },
  { value: "company", label: "Company" },
  { value: "message", label: "Message/Query" },
  { value: "custom", label: "Custom Field" },
];

const ACTION_TYPES = [
  { value: "assign_tag", label: "Assign Tags" },
  { value: "set_variable", label: "Set Variable" },
  { value: "notify_agent", label: "Notify Human Agent" },
  { value: "send_email", label: "Send Email" },
];

export default function SequentialFlowBuilder({ flowId, flowName, onBack }: SequentialFlowBuilderProps) {
  const { toast } = useToast();
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<FlowStep | null>(null);
  const [showStepConfig, setShowStepConfig] = useState(false);
  const [addStepIndex, setAddStepIndex] = useState<number | null>(null);

  const { data: flowData, isLoading } = useQuery<{ nodes: FlowStep[]; edges: unknown[] }>({
    queryKey: ["/api/admin/chatbot/flows", flowId, "nodes"],
    enabled: !!flowId,
  });

  useEffect(() => {
    if (flowData?.nodes?.length) {
      const nodes = flowData.nodes;
      const edges = flowData.edges as { sourceId: string; targetId: string }[] || [];
      
      if (nodes.some(n => n.order !== undefined && n.order !== 0)) {
        const orderedSteps = [...nodes].sort((a, b) => (a.order || 0) - (b.order || 0));
        setSteps(orderedSteps);
      } else if (edges.length > 0) {
        const ordered: FlowStep[] = [];
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        const targetIds = new Set(edges.map(e => e.targetId));
        
        let startNode = nodes.find(n => n.type === "start") || nodes.find(n => !targetIds.has(n.id));
        if (!startNode && nodes.length > 0) startNode = nodes[0];
        
        if (startNode) {
          ordered.push({ ...startNode, order: 0 });
          let currentId = startNode.id;
          let order = 1;
          
          while (order < nodes.length) {
            const edge = edges.find(e => e.sourceId === currentId);
            if (edge && nodeMap.has(edge.targetId)) {
              const nextNode = nodeMap.get(edge.targetId)!;
              ordered.push({ ...nextNode, order });
              currentId = nextNode.id;
              order++;
            } else {
              break;
            }
          }
          
          nodes.forEach(n => {
            if (!ordered.find(o => o.id === n.id)) {
              ordered.push({ ...n, order: ordered.length });
            }
          });
        }
        
        setSteps(ordered);
      } else {
        const orderedSteps = [...nodes].map((n, idx) => ({ ...n, order: idx }));
        setSteps(orderedSteps);
      }
    } else if (!flowId) {
      setSteps([createStep("start", 0)]);
    } else if (flowId && (!flowData?.nodes || flowData.nodes.length === 0)) {
      setSteps([createStep("start", 0)]);
    }
  }, [flowData, flowId]);

  const createStep = (type: FlowStep["type"], order: number): FlowStep => {
    return {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      order,
      config: getDefaultConfig(type),
    };
  };

  const getDefaultConfig = (type: FlowStep["type"]): StepConfig => {
    switch (type) {
      case "start":
        return { message: "Welcome! How can I help you today?" };
      case "message":
        return { message: "Enter your message here..." };
      case "get_user_details":
        return {
          message: "Could you please provide your details?",
          userFields: [{ id: `field_${Date.now()}`, fieldType: "name", label: "Your Name", required: true }]
        };
      case "action":
        return { actions: [{ id: `action_${Date.now()}`, actionType: "assign_tag", value: "" }] };
      case "condition":
        return { conditionField: "user_input", conditionOperator: "contains", conditionValue: "" };
      case "ai_response":
        return { message: "Let our AI assistant help you with that..." };
      case "api_call":
        return { apiEndpoint: "", apiMethod: "GET" };
      case "flow_connector":
        return { connectedFlowId: undefined };
      case "end":
        return { message: "Thank you for chatting with us. Have a great day!" };
      default:
        return {};
    }
  };

  const addStep = (type: FlowStep["type"], afterIndex: number) => {
    const newStep = createStep(type, afterIndex + 1);
    const updatedSteps = [...steps];
    updatedSteps.splice(afterIndex + 1, 0, newStep);
    updatedSteps.forEach((step, idx) => step.order = idx);
    setSteps(updatedSteps);
    setAddStepIndex(null);
    setSelectedStep(newStep);
    setShowStepConfig(true);
  };

  const updateStepConfig = (stepId: string, config: StepConfig) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, config } : s));
    if (selectedStep?.id === stepId) {
      setSelectedStep({ ...selectedStep, config });
    }
  };

  const deleteStep = (stepId: string) => {
    if (steps.find(s => s.id === stepId)?.type === "start") {
      toast({ title: "Cannot delete start step", variant: "destructive" });
      return;
    }
    const updatedSteps = steps.filter(s => s.id !== stepId);
    updatedSteps.forEach((step, idx) => step.order = idx);
    setSteps(updatedSteps);
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
      setShowStepConfig(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nodes = steps.map(step => ({
        id: step.id,
        type: step.type,
        position: { x: step.order * 300, y: 100 },
        config: step.config,
        order: step.order,
      }));
      const edges = steps.slice(0, -1).map((step, idx) => ({
        id: `edge_${step.id}_${steps[idx + 1]?.id}`,
        sourceId: step.id,
        targetId: steps[idx + 1]?.id,
      }));
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

  const getStepInfo = (type: string) => {
    for (const category of STEP_TYPES) {
      const found = category.items.find(item => item.type === type);
      if (found) return found;
    }
    return { type: "start", label: "Start", icon: Play, color: "bg-green-500", description: "" };
  };

  const renderStepCard = (step: FlowStep, index: number) => {
    const info = step.type === "start" 
      ? { label: "Start", icon: Play, color: "bg-green-500" }
      : getStepInfo(step.type);
    const Icon = info.icon;

    return (
      <div key={step.id} className="flex items-start gap-2" data-testid={`flow-step-${step.id}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <Card 
            className={`w-64 cursor-pointer transition-all hover-elevate group ${
              selectedStep?.id === step.id ? "ring-2 ring-primary shadow-lg" : ""
            }`}
            onClick={() => {
              setSelectedStep(step);
              setShowStepConfig(true);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${info.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm">{info.label}</h4>
                    {step.type !== "start" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStep(step.id);
                        }}
                        data-testid={`button-delete-step-${step.id}`}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {step.config.message?.substring(0, 60) || "Click to configure..."}
                    {step.config.message && step.config.message.length > 60 ? "..." : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {step.type !== "end" && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <Popover open={addStepIndex === index} onOpenChange={(open) => setAddStepIndex(open ? index : null)}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 rounded-full p-0 bg-background shadow-md border-dashed hover:border-primary hover:bg-primary/5"
                    data-testid={`button-add-after-${index}`}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="center">
                  <div className="p-2 border-b">
                    <p className="text-sm font-medium">Add Step</p>
                  </div>
                  <ScrollArea className="h-80">
                    <div className="p-2 space-y-3">
                      {STEP_TYPES.map((category) => (
                        <div key={category.category}>
                          <p className="text-xs font-medium text-muted-foreground px-2 mb-1">{category.category}</p>
                          <div className="space-y-1">
                            {category.items.map((item) => {
                              const ItemIcon = item.icon;
                              return (
                                <Button
                                  key={item.type}
                                  variant="ghost"
                                  className="w-full justify-start gap-3 h-auto py-2"
                                  onClick={() => addStep(item.type as FlowStep["type"], index)}
                                  data-testid={`button-add-${item.type}`}
                                >
                                  <div className={`w-8 h-8 rounded flex items-center justify-center ${item.color}`}>
                                    <ItemIcon className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="text-left">
                                    <p className="text-sm font-medium">{item.label}</p>
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                  </div>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </motion.div>

        {index < steps.length - 1 && (
          <div className="hidden" />
        )}
      </div>
    );
  };

  const renderConfigPanel = () => {
    if (!selectedStep) return null;

    const info = selectedStep.type === "start" 
      ? { label: "Start", icon: Play, color: "bg-green-500" }
      : getStepInfo(selectedStep.type);
    const Icon = info.icon;

    return (
      <Dialog open={showStepConfig} onOpenChange={setShowStepConfig}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded flex items-center justify-center ${info.color}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              {info.label}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-4 py-4">
            {(selectedStep.type === "start" || selectedStep.type === "message" || selectedStep.type === "end" || selectedStep.type === "ai_response") && (
              <div>
                <Label>Message</Label>
                <Textarea
                  value={selectedStep.config.message || ""}
                  onChange={(e) => updateStepConfig(selectedStep.id, { ...selectedStep.config, message: e.target.value })}
                  placeholder="Enter the message to display..."
                  className="mt-1.5 min-h-24"
                  data-testid="input-step-message"
                />
              </div>
            )}

            {selectedStep.type === "get_user_details" && (
              <>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={selectedStep.config.message || ""}
                    onChange={(e) => updateStepConfig(selectedStep.id, { ...selectedStep.config, message: e.target.value })}
                    placeholder="The message sent to the user..."
                    className="mt-1.5 min-h-20"
                    data-testid="input-user-details-message"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">User Details</Label>
                  <div className="space-y-3">
                    {(selectedStep.config.userFields || []).map((field, idx) => (
                      <Card key={field.id} className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Select
                              value={field.fieldType}
                              onValueChange={(v) => {
                                const updatedFields = [...(selectedStep.config.userFields || [])];
                                updatedFields[idx] = { ...field, fieldType: v };
                                updateStepConfig(selectedStep.id, { ...selectedStep.config, userFields: updatedFields });
                              }}
                            >
                              <SelectTrigger className="flex-1" data-testid={`select-field-type-${idx}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {USER_FIELD_TYPES.map(ft => (
                                  <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => {
                                const updatedFields = (selectedStep.config.userFields || []).filter((_, i) => i !== idx);
                                updateStepConfig(selectedStep.id, { ...selectedStep.config, userFields: updatedFields });
                              }}
                              data-testid={`button-remove-field-${idx}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <Input
                            value={field.label}
                            onChange={(e) => {
                              const updatedFields = [...(selectedStep.config.userFields || [])];
                              updatedFields[idx] = { ...field, label: e.target.value };
                              updateStepConfig(selectedStep.id, { ...selectedStep.config, userFields: updatedFields });
                            }}
                            placeholder="Enter a description..."
                            data-testid={`input-field-label-${idx}`}
                          />
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={field.required}
                              onCheckedChange={(checked) => {
                                const updatedFields = [...(selectedStep.config.userFields || [])];
                                updatedFields[idx] = { ...field, required: checked };
                                updateStepConfig(selectedStep.id, { ...selectedStep.config, userFields: updatedFields });
                              }}
                              data-testid={`switch-field-required-${idx}`}
                            />
                            <Label className="text-sm">Required</Label>
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newField = { id: `field_${Date.now()}`, fieldType: "email", label: "", required: false };
                        updateStepConfig(selectedStep.id, { 
                          ...selectedStep.config, 
                          userFields: [...(selectedStep.config.userFields || []), newField] 
                        });
                      }}
                      data-testid="button-add-user-field"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add new item
                    </Button>
                  </div>
                </div>
              </>
            )}

            {selectedStep.type === "action" && (
              <div>
                <Label className="mb-2 block">Actions</Label>
                <div className="space-y-3">
                  {(selectedStep.config.actions || []).map((action, idx) => (
                    <Card key={action.id} className="p-3">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Select
                            value={action.actionType}
                            onValueChange={(v) => {
                              const updatedActions = [...(selectedStep.config.actions || [])];
                              updatedActions[idx] = { ...action, actionType: v };
                              updateStepConfig(selectedStep.id, { ...selectedStep.config, actions: updatedActions });
                            }}
                          >
                            <SelectTrigger className="flex-1" data-testid={`select-action-type-${idx}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ACTION_TYPES.map(at => (
                                <SelectItem key={at.value} value={at.value}>{at.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              const updatedActions = (selectedStep.config.actions || []).filter((_, i) => i !== idx);
                              updateStepConfig(selectedStep.id, { ...selectedStep.config, actions: updatedActions });
                            }}
                            data-testid={`button-remove-action-${idx}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <Input
                          value={action.value}
                          onChange={(e) => {
                            const updatedActions = [...(selectedStep.config.actions || [])];
                            updatedActions[idx] = { ...action, value: e.target.value };
                            updateStepConfig(selectedStep.id, { ...selectedStep.config, actions: updatedActions });
                          }}
                          placeholder={action.actionType === "assign_tag" ? "Enter tag names, separated by commas" : "Enter value..."}
                          data-testid={`input-action-value-${idx}`}
                        />
                      </div>
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newAction = { id: `action_${Date.now()}`, actionType: "assign_tag", value: "" };
                      updateStepConfig(selectedStep.id, { 
                        ...selectedStep.config, 
                        actions: [...(selectedStep.config.actions || []), newAction] 
                      });
                    }}
                    data-testid="button-add-action"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add new item
                  </Button>
                </div>

                {selectedStep.type === "action" && (
                  <Button
                    variant="ghost"
                    className="w-full mt-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteStep(selectedStep.id)}
                    data-testid="button-delete-step"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                )}
              </div>
            )}

            {selectedStep.type === "condition" && (
              <div className="space-y-4">
                <div>
                  <Label>Condition Field</Label>
                  <Select
                    value={selectedStep.config.conditionField || "user_input"}
                    onValueChange={(v) => updateStepConfig(selectedStep.id, { ...selectedStep.config, conditionField: v })}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="select-condition-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user_input">User Input</SelectItem>
                      <SelectItem value="user_name">User Name</SelectItem>
                      <SelectItem value="user_email">User Email</SelectItem>
                      <SelectItem value="language">Language</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Operator</Label>
                  <Select
                    value={selectedStep.config.conditionOperator || "contains"}
                    onValueChange={(v) => updateStepConfig(selectedStep.id, { ...selectedStep.config, conditionOperator: v })}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="select-condition-operator">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="starts_with">Starts With</SelectItem>
                      <SelectItem value="ends_with">Ends With</SelectItem>
                      <SelectItem value="is_empty">Is Empty</SelectItem>
                      <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Value</Label>
                  <Input
                    value={selectedStep.config.conditionValue || ""}
                    onChange={(e) => updateStepConfig(selectedStep.id, { ...selectedStep.config, conditionValue: e.target.value })}
                    placeholder="Enter condition value..."
                    className="mt-1.5"
                    data-testid="input-condition-value"
                  />
                </div>
              </div>
            )}

            {selectedStep.type === "api_call" && (
              <div className="space-y-4">
                <div>
                  <Label>HTTP Method</Label>
                  <Select
                    value={selectedStep.config.apiMethod || "GET"}
                    onValueChange={(v) => updateStepConfig(selectedStep.id, { ...selectedStep.config, apiMethod: v })}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="select-api-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>API Endpoint</Label>
                  <Input
                    value={selectedStep.config.apiEndpoint || ""}
                    onChange={(e) => updateStepConfig(selectedStep.id, { ...selectedStep.config, apiEndpoint: e.target.value })}
                    placeholder="https://api.example.com/endpoint"
                    className="mt-1.5"
                    data-testid="input-api-endpoint"
                  />
                </div>
              </div>
            )}
          </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowStepConfig(false)} data-testid="button-save-step-config">
              Save changes
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
            <p className="text-sm text-muted-foreground">Click on steps to configure or use + to add new steps</p>
          </div>
        </div>
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending}
          className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
          data-testid="button-save-flow"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Flow
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div 
          className="p-8 min-h-[500px] overflow-auto"
          style={{ 
            background: "linear-gradient(135deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 100%)",
          }}
        >
          <div className="flex flex-col items-center gap-12">
            <AnimatePresence>
              {steps.map((step, index) => renderStepCard(step, index))}
            </AnimatePresence>
          </div>
        </div>
      </Card>

      {renderConfigPanel()}
    </div>
  );
}
