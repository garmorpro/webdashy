export function workflowStepState(stepIndex, currentIndex) {
  return { done: stepIndex < currentIndex, current: stepIndex === currentIndex };
}
