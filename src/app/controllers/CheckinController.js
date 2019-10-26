import { subDays } from 'date-fns';
import { Op } from 'sequelize';
import Checkin from '../models/Checkin';
import Student from '../models/Student';

class CheckinController {
  async index(req, res) {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      res.status(400).json({ error: 'Student not found.' });
    }

    const checkins = await Checkin.findAll({
      where: {
        student_id: req.params.id
      }
    });

    res.json(checkins);
  }

  async store(req, res) {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      res.status(400).json({ error: 'Student not found.' });
    }

    const dateNow = new Date();
    const dateOld = subDays(dateNow, 7);

    const numCheckins = await Checkin.count({
      where: {
        student_id: req.params.id,
        created_at: {
          [Op.between]: [dateOld, dateNow]
        }
      }
    });

    if (numCheckins >= 5) {
      res.status(400).json({ error: 'Maximum amount of checkins reached.' });
    }

    const student_id = student.id;

    const checkin = await Checkin.create({
      student_id
    });

    res.json(checkin);
  }
}

export default new CheckinController();
