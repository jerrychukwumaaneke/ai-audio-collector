import { and, asc, desc, eq, inArray} from "drizzle-orm";
import { db } from "../config/db";
import { languages, reviewerLanguages, submissions, tasks, users, reviews } from "../db/schema";


// this function fetches all the language IDs a reviewer is assigned to
export async function getReviewerLanguageIds(reviewerId: string) {
  const rows = await db
    .select({ languageId: reviewerLanguages.languageId })
    .from(reviewerLanguages)
    .where(eq(reviewerLanguages.reviewerId, reviewerId));

  return rows.map((r) => r.languageId);
}



// First gets the reviewer's assigned languages. If they have no languages assigned yet
export async function getReviewerQueue(reviewerId: string) {
  // get languages this reviewer is assigned 
  const languageIds = await getReviewerLanguageIds(reviewerId);

  if (languageIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: submissions.id,
      audioUrl: submissions.audioUrl,
      status: submissions.status,
      createdAt: submissions.createdAt,
      

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
    .where(
      and(
        eq(submissions.status, "PENDING"),
        inArray(submissions.languageCode, languageIds)
      )
    )
    .orderBy(asc(submissions.createdAt));

  return rows.map((row) => ({
    id: row.id,
    audioUrl: row.audioUrl,
    status: row.status,
    createdAt: row.createdAt,
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
      name: row.languageName,
      code: row.languageCode,
    },
  }));
}




export async function getQueueSubmissionById(
  submissionId: string,
  reviewerId: string
) {
  // get languages this reviewer is assigned to
  const languageIds = await getReviewerLanguageIds(reviewerId);

  if (languageIds.length === 0) return null;

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
      
      
      languageName: languages.name,
      languageCode: languages.code,
    })
    .from(submissions)
    .leftJoin(tasks, eq(tasks.id, submissions.taskId))
    .leftJoin(users, eq(users.id, submissions.userId))
    .leftJoin(languages, eq(languages.id, submissions.languageCode))
    .where(
      and(
        eq(submissions.id, submissionId),
        eq(submissions.status, "PENDING"),
        inArray(submissions.languageCode, languageIds) // must be in reviewer's language
      )
    );

  if (!row) return null;

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
      name: row.languageName,
      code: row.languageCode,
    },
  };
}



export async function reviewSubmission(
  submissionId: string,
  reviewerId: string,
  decision: "APPROVED" | "REJECTED",
  feedback?: string
) {
  // verify submission is in reviewer's language and is still PENDING
  const submission = await getQueueSubmissionById(submissionId, reviewerId);
  if (!submission) return null;

  return await db.transaction(async (tx) => {
    // create the review record
    const [review] = await tx
      .insert(reviews)
      .values({
        submissionId,
        reviewerId,
        decision,
        feedback: feedback ?? null,
      })
      .returning();

    // update submission status to match decision
    await tx
      .update(submissions)
      .set({ status: decision, updatedAt: new Date() })
      .where(eq(submissions.id, submissionId));

    return review;
  });
}



export async function getReviewerHistory(reviewerId: string) {
  const rows = await db
    .select({
      reviewId: reviews.id,
      decision: reviews.decision,
      feedback: reviews.feedback,
      reviewedAt: reviews.createdAt,
      
      submissionId: submissions.id,
      audioUrl: submissions.audioUrl,
      
      taskId: tasks.id,
      taskText: tasks.text,
      
      userId: users.id,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userEmail: users.email,
      
      
      languageName: languages.name,
      languageCode: languages.code,
    })
    .from(reviews)
    .leftJoin(submissions, eq(submissions.id, reviews.submissionId))
    .leftJoin(tasks, eq(tasks.id, submissions.taskId))
    .leftJoin(users, eq(users.id, submissions.userId))
    .leftJoin(languages, eq(languages.id, submissions.languageCode))
    .where(eq(reviews.reviewerId, reviewerId))
    .orderBy(desc(reviews.createdAt)); 

  return rows.map((row) => ({
    reviewId: row.reviewId,
    decision: row.decision,
    feedback: row.feedback,
    reviewedAt: row.reviewedAt,
    submission: {
      id: row.submissionId,
      audioUrl: row.audioUrl,
    },
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
      name: row.languageName,
      code: row.languageCode,
    },
  }));
}



export async function getReviewerStats(reviewerId: string) {
  const history = await getReviewerHistory(reviewerId);

  const total = history.length;
  const approved = history.filter((r) => r.decision === "APPROVED").length;
  const rejected = history.filter((r) => r.decision === "REJECTED").length;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return { total, approved, rejected, approvalRate };
}