export interface PubSubService {
  publish(topic: string, message: unknown): Promise<string>;
}
