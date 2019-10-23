import { Router } from 'express';

import SessionController from './app/controllers/SessionController';
import StudentController from './app/controllers/StudentController';
import PlanController from './app/controllers/PlanController';
import RegistrationController from './app/controllers/RegistrationController';

/**
 * Middlewares
 */
import authMiddleware from './app/middlewares/auth';
import checkPlanExists from './app/middlewares/checkPlanExists';

const routes = new Router();

routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.post('/students', StudentController.store);
routes.put('/students', StudentController.update);

routes.get('/plans', PlanController.index);
routes.post('/plans', PlanController.store);
routes.put('/plans/:id', checkPlanExists, PlanController.update);
routes.delete('/plans/:id', checkPlanExists, PlanController.delete);

routes.get('/registrations', RegistrationController.index);
routes.post('/registrations', RegistrationController.store);
routes.post('/registrations', RegistrationController.update);

export default routes;
