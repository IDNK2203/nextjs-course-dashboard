"use server";
// Tip: If you're working with forms that have many fields, you may want to consider using the entries()
// method with JavaScript's Object.fromEntries(). For example:
// const rawFormData = Object.fromEntries(formData.entries())
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const formSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const createInvoiceSchema = formSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, status, amount } = createInvoiceSchema.parse({
    customerId: formData.get("customerId"),
    status: formData.get("status"),
    amount: formData.get("amount"),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];
  try {
    await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (e) {
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, status, amount } = createInvoiceSchema.parse({
    customerId: formData.get("customerId"),
    status: formData.get("status"),
    amount: formData.get("amount"),
  });
  const amountInCents = amount * 100;
  try {
    await sql`
  UPDATE invoices
  SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
  WHERE id = ${id}
  `;
  } catch (e) {
    return {
      message: "Database Error: Failed to Update Invoice.",
    };
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  throw new Error("Failed to Delete Invoice");
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath("/dashboard/invoices");
    return {
      message: "Invoice Deleted",
    };
  } catch (e) {
    return {
      message: "Database Error: Failed to Delete Invoice.",
    };
  }
}
