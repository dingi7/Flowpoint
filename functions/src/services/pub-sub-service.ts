import { PubSub } from "@google-cloud/pubsub";

import { PubSubService } from "../core";

export const pubSubService: PubSubService = {
  publish: async (topic, message) => {
    const pubSub = new PubSub({
      projectId: process.env.GCLOUD_PROJECT,
    });

    return await pubSub.topic(topic).publishMessage({
      data: Buffer.from(JSON.stringify(message)),
    });
  },
};
