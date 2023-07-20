import type { IForm } from "./global";
import type { ReactFlowJsonObject, Node } from 'reactflow';
import { DEFAULT_HTML, FormDesigner } from "@formflow/elements/src";

function getSteps(chartData: ReactFlowJsonObject, activeNode: Node): string[] {
  const steps = [activeNode.id];
  const getNodeById = (id: string) => chartData.nodes.find(node => node.id === id);
  const getOutgoingNodes = (node: Node) => {
    const outgoingEdges = chartData.edges.filter(edge => edge.source === node.id);
    return outgoingEdges.map(edge => getNodeById(edge.target))
  }
  const getIncomingNodes = (node: Node) => {
    const incomingEdges = chartData.edges.filter(edge => edge.target === node.id);
    return incomingEdges.map(edge => getNodeById(edge.source))
  }

  let outgoingNodes = getOutgoingNodes(activeNode);
  while (outgoingNodes.length) {
    const node = outgoingNodes[0];
    steps.push(node.id)
    outgoingNodes = getOutgoingNodes(node);
  }

  let incomingNodes = getIncomingNodes(activeNode);
  while (incomingNodes.length) {
    const node = incomingNodes[0];
    steps.unshift(node.id)
    incomingNodes = getIncomingNodes(node);
  }

  return steps;
}

function getForms(chartData: ReactFlowJsonObject, steps: string[]): any {
  const forms = {};
  steps.forEach( (nodeId: string) => {
    const node = chartData.nodes.find(el => el.id === nodeId)
    forms[nodeId] = {
      type: 
        node.data?.label.indexOf('Review') !== -1 ? 'review' : 
        node.data?.label.indexOf('Thankyou') !== -1 ? 'submit' : 'form',
      title: node.data?.label,
      subTitle: node.data?.label + ' sub-title',
      html: '',
      defaultValues: {},
      skippable: true,
      getErrors: null
    } as IForm; // TODO
  });
  return forms;
}

export function setForm(chartData: ReactFlowJsonObject, activeNode: Node, html?: string) {
  html ||= DEFAULT_HTML;

  const steps = getSteps(chartData, activeNode).slice(1, -1);
  const forms = getForms(chartData, steps);
  const currentStepId = activeNode.id;
  const formDesigner = document.querySelector('form-designer') as FormDesigner;
  formDesigner.setHtml(html);
  formDesigner.setStyle('form.form-flow { min-height: 320px;}')
  formDesigner.runCommand('set-forms-steps', {forms, steps, currentStepId})
}

