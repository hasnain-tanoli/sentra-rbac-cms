export interface Permission {
  _id: string;
  resource: string;
  actions: string[];
  description?: string;
}
