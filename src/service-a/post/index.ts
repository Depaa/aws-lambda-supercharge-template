import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
// import { Tracer } from '@aws-lambda-powertools/tracer';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from 'aws-lambda';

const logger = new Logger();
const metrics = new Metrics();
// const tracer = new Tracer();

export const main: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  logger.debug('event', { ...event });

  metrics.addMetric('SuccessfulInvocations', MetricUnit.Count, 1);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello World' }),
  };
};
