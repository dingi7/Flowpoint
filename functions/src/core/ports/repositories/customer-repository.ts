import { Customer, CustomerData } from "../../entities/customer";
import { GenericRepository } from "./generic-repository";

export type CustomerRepository = GenericRepository<Customer, CustomerData>;