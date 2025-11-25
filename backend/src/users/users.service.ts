import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { User } from "./schemas/user.schema";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly model: Model<User>) {}

  async findOne(email: string): Promise<User | null> {
    return this.model.findOne({ email }).exec();
  }

  async findAll() {
    return this.model.find().select("-password").lean().exec();
  }

  async findById(id: string) {
    const user = await this.model.findById(id).select("-password").lean().exec();
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.model.exists({ email: dto.email });
    if (exists) throw new ConflictException("Email already in use");
    const hashed = await bcrypt.hash(dto.password, 10);
    const doc = await this.model.create({ ...dto, password: hashed });
    const { password, ...rest } = doc.toObject();
    return rest;
  }

  async update(id: string, dto: UpdateUserDto) {
    const updateData: any = { ...dto };
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }
    const updated = await this.model
      .findByIdAndUpdate(id, updateData, { new: true })
      .select("-password")
      .lean()
      .exec();
    if (!updated) throw new NotFoundException("User not found");
    return updated;
  }

  async remove(id: string) {
    const res = await this.model.findByIdAndDelete(id).lean().exec();
    if (!res) throw new NotFoundException("User not found");
    return { deleted: true };
  }
}
