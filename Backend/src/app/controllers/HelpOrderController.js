import * as Yup from 'yup';
import Student from '../models/Student';
import HelpOrder from '../models/HelpOrder';

import helpOrderMail from '../jobs/HelpOrderMail';
import Queue from '../../lib/Queue';

class HelpOrderController {
  async index(req, res) {
    const helpOrders = await HelpOrder.findAll({
      where: {
        answer: null
      },
      attributes: ['id', 'question', 'answer', 'answer_at'],
      include: [
        {
          model: Student,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return res.json(helpOrders);
  }

  async indexId(req, res) {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(400).json({ error: 'Student not found.' });
    }

    const helpOrders = await HelpOrder.findAll({
      where: {
        student_id: student.id
      },
      attributes: ['id', 'question', 'answer', 'answer_at'],
      include: [
        {
          model: Student,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return res.json(helpOrders);
  }

  async storeQuestion(req, res) {
    const schema = Yup.object().shape({
      question: Yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(400).json({ error: 'Student not found.' });
    }

    const help_order = await HelpOrder.create({
      student_id: student.id,
      question: req.body.question
    });

    return res.json(help_order);
  }

  async storeAnswer(req, res) {
    const schema = Yup.object().shape({
      answer: Yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const helpOrder = await HelpOrder.findByPk(req.params.id);
    const student = await Student.findByPk(helpOrder.student_id);

    helpOrder.answer = req.body.answer;
    helpOrder.answer_at = new Date();

    await helpOrder.save();

    await Queue.add(helpOrderMail.key, {
      student,
      question: helpOrder.question,
      answer: helpOrder.answer
    });

    return res.json(helpOrder);
  }
}

export default new HelpOrderController();
