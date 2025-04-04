import { ModelDetail } from "./types";

export const findModelOrder = (models: ModelDetail[]) => {
  const order = [];
  let currentModel = models.find((model) => model.prevModel === null);
  while (currentModel) {
    order.push(currentModel);
    currentModel = models.find((model) => model.id === currentModel?.nextModel);
  }
  return order;
};
export function areTwoObjectsEqual(arr1: unknown, arr2: unknown): boolean {
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}
