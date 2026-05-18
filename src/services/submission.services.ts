import { and, eq } from "drizzle-orm";
import { db } from "../config/db";
import { languages, reviews, submissions, tasks, users } from "../db/schema";


export async function createSubmission({
  taskId,
  userId,
  languageCode,
  audioUrl,
}: {
  taskId: string;
  userId: string;
  languageCode: string;
  audioUrl: string;
}) {

  const existing = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.taskId, taskId),
        eq(submissions.languageCode, languageCode),
        eq(submissions.userId, userId)
      )
    );

  if (existing.length > 0) {
    throw new Error("You have already recorded this task in this language");
  }



  const [submission] = await db
    .insert(submissions)
    .values({
      taskId,
      userId,
      languageCode,
      audioUrl,
      status: "PENDING",
    })
    .returning();

  return submission;
}


export async function getAllSubmissions(filters?: {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  languageId?: string;
  userId?: string;
}) {
  let query = db
    .select({
      id: submissions.id,
      audioUrl: submissions.audioUrl,
      status: submissions.status,
      createdAt: submissions.createdAt,
      updatedAt: submissions.updatedAt,

      
      taskId: tasks.id,
      taskText: tasks.text,
      
      
      userId: users.id,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userEmail: users.email,
      
      
      languageName: languages.name,
      languageCode: languages.code,
    })
    .from(submissions)
    .leftJoin(tasks, eq(tasks.id, submissions.taskId))
    .leftJoin(users, eq(users.id, submissions.userId))
    .leftJoin(languages, eq(languages.id, submissions.languageCode))
    .$dynamic();

  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(submissions.status, filters.status));
  }

  if (filters?.languageId) {
    conditions.push(eq(submissions.languageCode, filters.languageId));
  }

  if (filters?.userId) {
    conditions.push(eq(submissions.userId, filters.userId));
  }


  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const rows = await query.orderBy(submissions.createdAt);

  return rows.map((row) => ({
    id: row.id,
    audioUrl: row.audioUrl,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    task: {
      id: row.taskId,
      text: row.taskText,
    },
    user: {
      id: row.userId,
      firstName: row.userFirstName,
      lastName: row.userLastName,
      email: row.userEmail,
    },
    language: {
      id: row.languageCode,
      name: row.languageName,
      code: row.languageCode,
    },
  }));
}


export async function findSubmissionById(id: string) {

  const [row] = await db
    .select({
      id: submissions.id,
      audioUrl: submissions.audioUrl,
      status: submissions.status,
      createdAt: submissions.createdAt,
      updatedAt: submissions.updatedAt,
      

      taskId: tasks.id,
      taskText: tasks.text,
      

      userId: users.id,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userEmail: users.email,
      

      languageId: languages.id,
      languageName: languages.name,
      languageCode: languages.code,
    })
    .from(submissions)
    .leftJoin(tasks, eq(tasks.id, submissions.taskId))
    .leftJoin(users, eq(users.id, submissions.userId))
    .leftJoin(languages, eq(languages.id, submissions.languageCode))
    .where(eq(submissions.id, id));

  if (!row) return null;


  const reviewHistory = await db
    .select({
      id: reviews.id,
      decision: reviews.decision,
      feedback: reviews.feedback,
      createdAt: reviews.createdAt,
      reviewerId: users.id,
      reviewerFirstName: users.firstName,
      reviewerLastName: users.lastName,
    })
    .from(reviews)
    .leftJoin(users, eq(users.id, reviews.reviewerId))
    .where(eq(reviews.submissionId, id))
    .orderBy(reviews.createdAt);

  return {
    id: row.id,
    audioUrl: row.audioUrl,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    task: {
      id: row.taskId,
      text: row.taskText,
    },
    user: {
      id: row.userId,
      firstName: row.userFirstName,
      lastName: row.userLastName,
      email: row.userEmail,
    },
    language: {
      id: row.languageId,
      name: row.languageName,
      code: row.languageCode,
    },
    reviewHistory: reviewHistory.map((r) => ({
      id: r.id,
      decision: r.decision,
      feedback: r.feedback,
      createdAt: r.createdAt,
      reviewer: {
        id: r.reviewerId,
        firstName: r.reviewerFirstName,
        lastName: r.reviewerLastName,
      },
    })),
  };
}