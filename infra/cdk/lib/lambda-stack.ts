import * as cdk from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import path = require('path');

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaAppDirA = path.resolve(__dirname, '../../../');
    const serviceAPost = new NodejsFunction(this, 'ServiceA-post', {
      description: 'Lambda for service A - post api - TS',
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      projectRoot: lambdaAppDirA,
      entry: path.join(lambdaAppDirA, 'src/service-a/post/handler.ts'),
      depsLockFilePath: path.join(lambdaAppDirA, 'package-lock.json'),
      bundling: {
        minify: true,
        sourceMap: true,
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
        POWERTOOLS_SERVICE_NAME: 'ServiceA-post',
        POWERTOOLS_METRICS_NAMESPACE: 'ServiceA',
        POWERTOOLS_LOG_LEVEL: 'DEBUG',
      },
    });

    const lambdaAppDirB = path.resolve(__dirname, '../../../');
    const serviceBPost = new NodejsFunction(this, 'ServiceB-post', {
      description: 'Lambda for service B - post api - JS',
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      projectRoot: lambdaAppDirB,
      entry: path.join(lambdaAppDirA, 'src/service-b/post/handler.js'),
      depsLockFilePath: path.join(lambdaAppDirB, 'package-lock.json'),
      bundling: {
        minify: true,
        sourceMap: true,
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

    // Create an API Gateway
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

    // Create a resource and method for the API
    httpApi.addRoutes({
      path: '/service-a',
      methods: [HttpMethod.POST],
      integration: templateLambdaIntegration,
    });

    const templateLambdaBIntegration = new HttpLambdaIntegration(
      'ServiceAPIBIntegration',
      serviceBPost,
    );

    // Create a resource and method for the API
    httpApi.addRoutes({
      path: '/service-b',
      methods: [HttpMethod.POST],
      integration: templateLambdaBIntegration,
    });
  }
}
