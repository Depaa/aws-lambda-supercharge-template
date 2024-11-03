import * as cdk from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import {
  ApplicationLogLevel,
  Architecture,
  Runtime,
  SystemLogLevel,
} from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join, resolve } from 'path';

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaAppDir = resolve(__dirname, '../../../');
    const serviceAPost = new NodejsFunction(this, 'ServiceA-post', {
      description: 'Lambda for service A - post api - TS',
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      projectRoot: lambdaAppDir,
      entry: join(lambdaAppDir, 'src/service-a/post/handler.ts'),
      depsLockFilePath: join(lambdaAppDir, 'package-lock.json'),
      applicationLogLevel: ApplicationLogLevel.INFO,
      systemLogLevel: SystemLogLevel.INFO,
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        platform: 'node',
        esbuildArgs: {
          '--tree-shaking': 'true',
        },
        nodeModules: [
          '@aws-lambda-powertools/logger',
          '@aws-lambda-powertools/metrics',
          '@aws-lambda-powertools/tracer',
        ],
      },
      environment: {
        POWERTOOLS_SERVICE_NAME: 'ServiceA-post',
        POWERTOOLS_METRICS_NAMESPACE: 'ServiceA',
        POWERTOOLS_LOG_LEVEL: 'DEBUG',
      },
    });

    const serviceBPost = new NodejsFunction(this, 'ServiceB-post', {
      description: 'Lambda for service B - post api - JS',
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      projectRoot: lambdaAppDir,
      entry: join(lambdaAppDir, 'src/service-b/post/handler.js'),
      depsLockFilePath: join(lambdaAppDir, 'package-lock.json'),
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        externalModules: [],
        platform: 'node',
        esbuildArgs: {
          '--tree-shaking': 'true',
        },
        nodeModules: [
          '@aws-lambda-powertools/logger',
          '@aws-lambda-powertools/metrics',
          '@aws-lambda-powertools/tracer',
        ],
      },
      environment: {
        POWERTOOLS_SERVICE_NAME: 'ServiceB-post',
        POWERTOOLS_METRICS_NAMESPACE: 'ServiceB',
        POWERTOOLS_LOG_LEVEL: 'DEBUG',
      },
    });

    const httpApi = new HttpApi(this, 'ServiceAPI', {
      apiName: 'ServiceAPI',
      corsPreflight: {
        allowMethods: [CorsHttpMethod.POST],
        allowOrigins: ['*'],
      },
    });

    const templateLambdaIntegration = new HttpLambdaIntegration(
      'ServiceAPIIntegration',
      serviceAPost,
    );
    httpApi.addRoutes({
      path: '/service-a',
      methods: [HttpMethod.POST],
      integration: templateLambdaIntegration,
    });

    const templateLambdaBIntegration = new HttpLambdaIntegration(
      'ServiceAPIBIntegration',
      serviceBPost,
    );
    httpApi.addRoutes({
      path: '/service-b',
      methods: [HttpMethod.POST],
      integration: templateLambdaBIntegration,
    });
  }
}
