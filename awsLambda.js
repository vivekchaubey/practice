// AWS Lambda Integration Utilities
// Architecture: 1 Orchestrator Lambda + 4 Worker Agent Lambdas

const AWS_API_ENDPOINT = process.env.REACT_APP_AWS_API_ENDPOINT || 'https://your-api-gateway-url.amazonaws.com';
const AWS_REGION = process.env.REACT_APP_AWS_REGION || 'us-east-1';

// Lambda function names
const LAMBDA_FUNCTIONS = {
  ORCHESTRATOR: 'orchestrator-lambda',
  WORKER_AGENT_1: 'worker-agent-1-lambda',
  WORKER_AGENT_2: 'worker-agent-2-lambda',
  WORKER_AGENT_3: 'worker-agent-3-lambda',
  WORKER_AGENT_4: 'worker-agent-4-lambda',
};

/**
 * Generic function to invoke any AWS Lambda through API Gateway
 * @param {string} functionName - Name of the Lambda function to invoke
 * @param {object} payload - Data to send to Lambda
 * @returns {Promise} Response from Lambda
 */
export const invokeLambda = async (functionName, payload) => {
  try {
    const response = await fetch(`${AWS_API_ENDPOINT}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Lambda invocation failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error invoking Lambda ${functionName}:`, error);
    throw error;
  }
};

/**
 * Invoke Orchestrator Lambda
 * The orchestrator manages workflow and delegates to worker agents
 * @param {string} message - User message
 * @param {object} context - Additional context
 * @param {function} addStatusUpdate - Function to add status updates
 * @returns {Promise} Orchestrator response
 */
export const invokeOrchestrator = async (message, context = {}, addStatusUpdate) => {
  try {
    addStatusUpdate('processing', 'Orchestrator invoked', `Function: ${LAMBDA_FUNCTIONS.ORCHESTRATOR}`);

    const payload = {
      message: message,
      context: context,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    };

    const response = await invokeLambda(LAMBDA_FUNCTIONS.ORCHESTRATOR, payload);

    addStatusUpdate('success', 'Orchestrator processing', `Task delegated to ${response.assignedAgents?.length || 0} worker(s)`);

    return response;
  } catch (error) {
    addStatusUpdate('error', 'Orchestrator error', error.message);
    throw error;
  }
};

/**
 * Invoke Worker Agent 1
 * @param {object} task - Task assigned by orchestrator
 * @param {function} addStatusUpdate - Function to add status updates
 * @returns {Promise} Worker response
 */
export const invokeWorkerAgent1 = async (task, addStatusUpdate) => {
  try {
    addStatusUpdate('processing', 'Worker Agent 1 started', `Processing task: ${task.type || 'Unknown'}`);

    const response = await invokeLambda(LAMBDA_FUNCTIONS.WORKER_AGENT_1, {
      task: task,
      agentId: 'worker-1',
      timestamp: new Date().toISOString(),
    });

    addStatusUpdate('success', 'Worker Agent 1 completed', `Result: ${response.status || 'Success'}`);

    return response;
  } catch (error) {
    addStatusUpdate('error', 'Worker Agent 1 failed', error.message);
    throw error;
  }
};

/**
 * Invoke Worker Agent 2
 * @param {object} task - Task assigned by orchestrator
 * @param {function} addStatusUpdate - Function to add status updates
 * @returns {Promise} Worker response
 */
export const invokeWorkerAgent2 = async (task, addStatusUpdate) => {
  try {
    addStatusUpdate('processing', 'Worker Agent 2 started', `Processing task: ${task.type || 'Unknown'}`);

    const response = await invokeLambda(LAMBDA_FUNCTIONS.WORKER_AGENT_2, {
      task: task,
      agentId: 'worker-2',
      timestamp: new Date().toISOString(),
    });

    addStatusUpdate('success', 'Worker Agent 2 completed', `Result: ${response.status || 'Success'}`);

    return response;
  } catch (error) {
    addStatusUpdate('error', 'Worker Agent 2 failed', error.message);
    throw error;
  }
};

/**
 * Invoke Worker Agent 3
 * @param {object} task - Task assigned by orchestrator
 * @param {function} addStatusUpdate - Function to add status updates
 * @returns {Promise} Worker response
 */
export const invokeWorkerAgent3 = async (task, addStatusUpdate) => {
  try {
    addStatusUpdate('processing', 'Worker Agent 3 started', `Processing task: ${task.type || 'Unknown'}`);

    const response = await invokeLambda(LAMBDA_FUNCTIONS.WORKER_AGENT_3, {
      task: task,
      agentId: 'worker-3',
      timestamp: new Date().toISOString(),
    });

    addStatusUpdate('success', 'Worker Agent 3 completed', `Result: ${response.status || 'Success'}`);

    return response;
  } catch (error) {
    addStatusUpdate('error', 'Worker Agent 3 failed', error.message);
    throw error;
  }
};

/**
 * Invoke Worker Agent 4
 * @param {object} task - Task assigned by orchestrator
 * @param {function} addStatusUpdate - Function to add status updates
 * @returns {Promise} Worker response
 */
export const invokeWorkerAgent4 = async (task, addStatusUpdate) => {
  try {
    addStatusUpdate('processing', 'Worker Agent 4 started', `Processing task: ${task.type || 'Unknown'}`);

    const response = await invokeLambda(LAMBDA_FUNCTIONS.WORKER_AGENT_4, {
      task: task,
      agentId: 'worker-4',
      timestamp: new Date().toISOString(),
    });

    addStatusUpdate('success', 'Worker Agent 4 completed', `Result: ${response.status || 'Success'}`);

    return response;
  } catch (error) {
    addStatusUpdate('error', 'Worker Agent 4 failed', error.message);
    throw error;
  }
};

/**
 * Process chat message through orchestrator workflow
 * Orchestrator will delegate to appropriate worker agents
 * @param {string} message - User message
 * @param {function} addStatusUpdate - Function to add status updates
 * @returns {Promise} Final processed response
 */
export const processChatMessage = async (message, addStatusUpdate) => {
  try {
    // Step 1: Invoke Orchestrator
    addStatusUpdate('info', 'Starting workflow', 'Sending message to orchestrator');

    const orchestratorResponse = await invokeOrchestrator(message, {}, addStatusUpdate);

    // Step 2: Orchestrator assigns tasks to workers
    const { tasks, assignedAgents } = orchestratorResponse;

    if (!tasks || tasks.length === 0) {
      addStatusUpdate('warning', 'No tasks assigned', 'Orchestrator returned no work items');
      return orchestratorResponse;
    }

    // Step 3: Invoke worker agents based on orchestrator's decision
    const workerPromises = [];

    tasks.forEach((task, index) => {
      const agentId = assignedAgents[index];

      switch(agentId) {
        case 'worker-1':
          workerPromises.push(invokeWorkerAgent1(task, addStatusUpdate));
          break;
        case 'worker-2':
          workerPromises.push(invokeWorkerAgent2(task, addStatusUpdate));
          break;
        case 'worker-3':
          workerPromises.push(invokeWorkerAgent3(task, addStatusUpdate));
          break;
        case 'worker-4':
          workerPromises.push(invokeWorkerAgent4(task, addStatusUpdate));
          break;
        default:
          addStatusUpdate('warning', 'Unknown agent', `Agent ID: ${agentId}`);
      }
    });

    // Step 4: Wait for all workers to complete
    addStatusUpdate('processing', 'Workers executing', `Running ${workerPromises.length} worker agent(s)`);

    const workerResults = await Promise.all(workerPromises);

    // Step 5: Aggregate results
    addStatusUpdate('success', 'Workflow completed', 'All agents finished successfully');

    return {
      success: true,
      message: message,
      orchestratorResponse: orchestratorResponse,
      workerResults: workerResults,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    addStatusUpdate('error', 'Workflow failed', error.message);
    throw error;
  }
};

/**
 * Check health status of all Lambda functions
 * @param {function} addStatusUpdate - Function to add status updates
 * @returns {Promise} Health status of all lambdas
 */
export const checkLambdaHealth = async (addStatusUpdate) => {
  try {
    addStatusUpdate('info', 'Health check started', 'Checking all Lambda functions');

    const healthChecks = await Promise.allSettled([
      invokeLambda(LAMBDA_FUNCTIONS.ORCHESTRATOR, { action: 'health' }),
      invokeLambda(LAMBDA_FUNCTIONS.WORKER_AGENT_1, { action: 'health' }),
      invokeLambda(LAMBDA_FUNCTIONS.WORKER_AGENT_2, { action: 'health' }),
      invokeLambda(LAMBDA_FUNCTIONS.WORKER_AGENT_3, { action: 'health' }),
      invokeLambda(LAMBDA_FUNCTIONS.WORKER_AGENT_4, { action: 'health' }),
    ]);

    const healthy = healthChecks.filter(check => check.status === 'fulfilled').length;
    const unhealthy = healthChecks.length - healthy;

    if (unhealthy > 0) {
      addStatusUpdate('warning', 'Health check completed', `${healthy}/${healthChecks.length} Lambdas healthy`);
    } else {
      addStatusUpdate('success', 'Health check completed', 'All Lambdas healthy');
    }

    return {
      orchestrator: healthChecks[0].status === 'fulfilled',
      worker1: healthChecks[1].status === 'fulfilled',
      worker2: healthChecks[2].status === 'fulfilled',
      worker3: healthChecks[3].status === 'fulfilled',
      worker4: healthChecks[4].status === 'fulfilled',
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    addStatusUpdate('error', 'Health check failed', error.message);
    throw error;
  }
};

/**
 * Initialize the agent system
 * @param {function} addStatusUpdate - Function to add status updates
 * @returns {Promise} Initialization result
 */
export const initializeAgentSystem = async (addStatusUpdate) => {
  try {
    addStatusUpdate('info', 'Initializing system', 'Connecting to AWS Lambda backend');

    const healthStatus = await checkLambdaHealth(addStatusUpdate);

    if (Object.values(healthStatus).filter(v => v === true).length === 5) {
      addStatusUpdate('success', 'System initialized', 'All 5 Lambda functions ready');
    } else {
      addStatusUpdate('warning', 'Partial initialization', 'Some Lambda functions unavailable');
    }

    return healthStatus;
  } catch (error) {
    addStatusUpdate('error', 'Initialization failed', error.message);
    throw error;
  }
};

/**
 * Generate unique request ID
 * @returns {string} Unique request ID
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Export all functions and constants
export default {
  LAMBDA_FUNCTIONS,
  invokeLambda,
  invokeOrchestrator,
  invokeWorkerAgent1,
  invokeWorkerAgent2,
  invokeWorkerAgent3,
  invokeWorkerAgent4,
  processChatMessage,
  checkLambdaHealth,
  initializeAgentSystem,
};