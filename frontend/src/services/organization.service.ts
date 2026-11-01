
import api from "./api";
import type {
  BuyerOrganization,
  PaginatedResponse,
} from "../types/invoice.types";

export const organizationService = {
  async getActiveBuyers(): Promise<BuyerOrganization[]> {
    const response = await api.get<PaginatedResponse<BuyerOrganization>>(
      "/organizations/buyers/"
    );

    return response.data.results;
  },
};
