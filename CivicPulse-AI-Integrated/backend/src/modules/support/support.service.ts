import SupportRequest from "./support.model";

type CreateSupportRequestInput = {
  email: string;
  category:
    | "Technical issue"
    | "Incident workflow"
    | "Account access"
    | "Other request";
  message: string;
};

export const createSupportRequest = async (
  data: CreateSupportRequestInput
) => {
  const supportRequest = await SupportRequest.create({
    email: data.email,
    category: data.category,
    message: data.message
  });

  return supportRequest;
};

export const getAllSupportRequests = async () => {
  return SupportRequest.find().sort({ createdAt: -1 });
};

export const getSupportRequestById = async (id: string) => {
  return SupportRequest.findById(id);
};

export const updateSupportRequestStatus = async (
  id: string,
  status: "open" | "in_progress" | "resolved"
) => {
  return SupportRequest.findByIdAndUpdate(
    id,
    { status },
    {
      new: true,
      runValidators: true
    }
  );
};