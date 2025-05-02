'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import postgres from 'postgres';
import { z } from 'zod';

import { signIn } from '@/auth';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  // 可以考虑添加一个字段来存放成功解析的数据，即使整体验证失败
  validatedData?: Partial<z.infer<typeof CreateInvoice>>;
  message?: string | null;
};

const FormSchema = z.object({
  id: z.string(),
  customerId: z
    .string({
      invalid_type_error: 'Please select a customer.',
    })
    .min(1, 'Please select a customer.'), // 添加 .min(1) 确保非空字符串
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

// 定义 CreateInvoice 的字段类型，方便后面使用
type CreateInvoiceFields = z.infer<typeof CreateInvoice>;
type CreateInvoiceKeys = keyof CreateInvoiceFields;

export async function createInvoice(prevState: State, formData: FormData): Promise<State> {
  // 1. 获取原始输入值
  const rawData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  };

  // 2. 尝试完整验证
  const validatedFields = CreateInvoice.safeParse(rawData);

  // 3. 处理验证失败的情况
  if (!validatedFields.success) {
    const { fieldErrors } = validatedFields.error.flatten();
    const partiallyValidatedData: Partial<CreateInvoiceFields> = {};

    // 遍历 Schema 中的每个字段
    for (const key of Object.keys(CreateInvoice.shape) as CreateInvoiceKeys[]) {
      const fieldSchema = CreateInvoice.shape[key];
      const rawValue = rawData[key];

      // 如果原始错误对象中没有该字段的错误，则尝试单独解析它
      if (!fieldErrors[key]) {
        const fieldResult = fieldSchema.safeParse(rawValue);
        if (fieldResult.success) {
          // 类型断言是安全的，因为 key 是 CreateInvoiceKeys
          partiallyValidatedData[key] = fieldResult.data as any;
        }
        // 注意：如果单独解析也失败了（理论上不太可能，除非 Zod 内部逻辑复杂），
        // 这里我们选择不添加它到 partiallyValidatedData，错误信息已在 fieldErrors 中。
      }
    }

    return {
      errors: fieldErrors,
      validatedData: partiallyValidatedData, // 返回成功解析的部分数据
      message: 'Missing or invalid fields. Failed to Create Invoice.',
    };
  }
  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    console.error('Database Error:', error);
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const _UpdateInvoice = FormSchema.omit({ id: true, date: true });
export async function updateInvoice(id: string, prevState: State, formData: FormData): Promise<State> {
  // 1. 获取原始输入值
  const rawData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  };

  // 2. 尝试完整验证
  const validatedFields = CreateInvoice.safeParse(rawData);

  // 3. 处理验证失败的情况
  if (!validatedFields.success) {
    const { fieldErrors } = validatedFields.error.flatten();
    const partiallyValidatedData: Partial<CreateInvoiceFields> = {};

    // 遍历 Schema 中的每个字段
    for (const key of Object.keys(CreateInvoice.shape) as CreateInvoiceKeys[]) {
      const fieldSchema = CreateInvoice.shape[key];
      const rawValue = rawData[key];

      // 如果原始错误对象中没有该字段的错误，则尝试单独解析它
      if (!fieldErrors[key]) {
        const fieldResult = fieldSchema.safeParse(rawValue);
        if (fieldResult.success) {
          // 类型断言是安全的，因为 key 是 CreateInvoiceKeys
          partiallyValidatedData[key] = fieldResult.data as any;
        }
        // 注意：如果单独解析也失败了（理论上不太可能，除非 Zod 内部逻辑复杂），
        // 这里我们选择不添加它到 partiallyValidatedData，错误信息已在 fieldErrors 中。
      }
    }

    return {
      errors: fieldErrors,
      validatedData: partiallyValidatedData, // 返回成功解析的部分数据
      message: 'Missing or invalid fields. Failed to Create Invoice.',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Database Error:', error);
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  throw new Error('Function not implemented.');
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}
