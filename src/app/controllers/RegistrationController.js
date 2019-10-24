import * as Yup from 'yup';
import { addMonths, parseISO, startOfHour } from 'date-fns';

import Registration from '../models/Registration';
import Plan from '../models/Plan';
import Student from '../models/Student';

class RegistrationController {
  async index(req, res) {
    const registrations = await Registration.findAll({
      attributes: ['id', 'start_date', 'end_date', 'price'],
      include: [
        {
          model: Student,
          attributes: ['id', 'name', 'email']
        },
        {
          model: Plan,
          attributes: ['id', 'title', 'duration']
        }
      ]
    });

    return res.json(registrations);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const { student_id, plan_id } = req.body;
    const start_date = startOfHour(parseISO(req.body.start_date));

    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }

    const plan = await Plan.findByPk(plan_id);

    if (!plan) {
      return res.status(400).json({ error: 'Plan not found' });
    }

    const end_date = addMonths(start_date, plan.duration);

    const price = plan.price * plan.duration;

    const { id } = await Registration.create({
      start_date,
      end_date,
      price
    });

    return res.json({
      id,
      student_id,
      plan_id,
      start_date,
      end_date,
      price
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number(),
      plan_id: Yup.number(),
      start_date: Yup.date()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const registration = await Registration.findByPk(req.params.id);

    const plan_id = req.body.plan_id ? req.body.plan_id : registration.plan_id;

    const plan = await Plan.findByPk(plan_id);

    let start_date = startOfHour(parseISO(req.body.start_date));

    if (!start_date) {
      start_date = registration.start_date;
    }

    const end_date = addMonths(start_date, plan.duration);

    const price = plan.price * plan.duration;

    const { id, student_id } = await registration.update({
      start_date,
      end_date,
      price
    });

    return res.json({
      id,
      student_id,
      plan_id,
      start_date,
      end_date,
      price
    });
  }

  async delete(req, res) {
    const registration = await Registration.findByPk(req.params.id);

    await registration.destroy();

    return res.json();
  }
}

export default new RegistrationController();
