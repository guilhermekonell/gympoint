import * as Yup from 'yup';
import { addMonths, parseISO, startOfHour } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Registration from '../models/Registration';
import Plan from '../models/Plan';
import Student from '../models/Student';

import RegistrationMail from '../jobs/RegistrationMail';
import Queue from '../../lib/Queue';

class RegistrationController {
  async index(req, res) {
    const registrations = await Registration.findAll({
      where: { canceled_at: null },
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

    /**
     * Verify student exists
     */
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }

    /**
     * Verify plan exists
     */
    const plan = await Plan.findByPk(plan_id);
    if (!plan) {
      return res.status(400).json({ error: 'Plan not found' });
    }

    const end_date = addMonths(start_date, plan.duration);

    const price = plan.price * plan.duration;

    const { id, canceled_at } = await Registration.create({
      start_date,
      end_date,
      price,
      student_id,
      plan_id
    });

    await Queue.add(RegistrationMail.key, {
      student,
      plan,
      end_date,
      price
    });

    return res.json({
      id,
      student_id,
      plan_id,
      price,
      start_date,
      end_date,
      canceled_at
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

    if (!registration) {
      return res.status(400).json({ error: 'Registration not found' });
    }

    /**
     * Verify student exists
     */
    const student_id = req.body.student_id
      ? req.body.student_id
      : registration.student_id;
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }

    /**
     * Verify plan exists
     */
    const plan_id = req.body.plan_id ? req.body.plan_id : registration.plan_id;
    const plan = await Plan.findByPk(plan_id);
    if (!plan) {
      return res.status(400).json({ error: 'Plan not found' });
    }

    let start_date = startOfHour(parseISO(req.body.start_date));

    if (!start_date) {
      start_date = registration.start_date;
    }

    const end_date = addMonths(start_date, plan.duration);

    const price = plan.price * plan.duration;

    const { id } = await registration.update({
      start_date,
      end_date,
      price,
      student_id,
      plan_id
    });

    return res.json({
      id,
      start_date,
      end_date,
      price,
      student_id,
      plan_id
    });
  }

  async delete(req, res) {
    const registration = await Registration.findByPk(req.params.id, {
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

    if (!registration) {
      return res.status(400).json({ error: 'Registration not found' });
    }

    registration.canceled_at = new Date();

    await registration.save();

    return res.json(registration);
  }
}

export default new RegistrationController();
