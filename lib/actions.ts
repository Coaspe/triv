/** @format */

"use server";

import { findModelOrder } from "@/app/utils";
import { db, storage } from "./firebase/admin";
import { ModelDetails, Category } from "@/app/types";
import { nanoid } from "nanoid";

export async function getModelDetail(id: string) {
  try {
    const model = await db.collection("models").doc(id).get();
    const modelData = model.data() as ModelDetails;

    // Use listAll to get all images
    const images = (await storage.bucket().getFiles({ prefix: id }))[0];

    if (!modelData.signedImageUrls) {
      modelData.signedImageUrls = {};
    }

    // start with index 1 for images
    for (let i = 0; i < images.length; i++) {
      if (images[i] && modelData.images) {
        const image = images[i];
        const result = await image.getSignedUrl({ action: "read", expires: Date.now() + 1000 * 60 * 60 });
        modelData.signedImageUrls[image.name] = result[0];
      }
    }
    return modelData;
  } catch (error) {
    console.error("Error fetching model detail:", error);
    throw error;
  }
}

export async function updateModelOrder(category: Category, orderIds: string[]) {
  try {
    const batch = db.batch();

    orderIds.forEach((id, index) => {
      const ref = db.collection("models").doc(id);
      batch.update(ref, { order: index });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error updating model order:", error);
    throw error;
  }
}

export async function deleteModel(modelId: string) {
  try {
    // Delete from Firestore
    await db.collection("models").doc(modelId).delete();

    // Delete images from Storage
    const files = await storage.bucket().getFiles({
      prefix: modelId,
    });

    await Promise.all(files[0].map((file) => file.delete()));
  } catch (error) {
    console.error("Error deleting model:", error);
    throw error;
  }
}

export const get_model_info = async (category: Category) => {
  const modelsSnapshot = await db.collection("models").where("category", "==", category).limit(3).get();

  const models = await Promise.all(
    modelsSnapshot.docs.map(async (doc) => {
      const model = doc.data() as ModelDetails;

      model.signedImageUrls = {};
      if (model.images && model.images.length > 0) {
        const result = await storage
          .bucket()
          .file(model.images[0])
          .getSignedUrl({
            action: "read",
            expires: Date.now() + 1000 * 60 * 60, // 1시간
          });
        model.signedImageUrls[model.images[0]] = result[0];
      }
      return model;
    })
  );
  return findModelOrder(models);
};

export async function updateModelField(modelId: string, field: keyof ModelDetails, value: string | string[]) {
  try {
    await db
      .collection("models")
      .doc(modelId)
      .update({
        [field]: value,
      });
  } catch (error) {
    console.error("Error updating model field:", error);
    throw error;
  }
}

export async function updateModelImages(modelId: string, images: string[]) {
  try {
    await db.collection("models").doc(modelId).update({
      images,
    });
  } catch (error) {
    console.error("Error updating model images:", error);
    throw error;
  }
}

export async function uploadImages(modelId: string, files: FileList) {
  try {
    const uploadPromises = Array.from(files).map(async (file, index) => {
      const fileName = `${modelId}/${Date.now()}-${index + 1}.png`;
      const imageRef = storage.bucket().file(fileName);
      const buffer = await file.arrayBuffer();
      await imageRef.save(Buffer.from(buffer));
      return fileName;
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading images:", error);
    throw error;
  }
}

export async function createModel(name: string, category: Category) {
  try {
    const modelId = nanoid();
    const now = new Date().toISOString();

    await db.collection("models").doc(modelId).set({
      id: modelId,
      name,
      category,
      displayName: name,
      images: [],
      experience: [],
      instagram: "",
      youtube: "",
      tiktok: "",
      createdAt: now,
      updatedAt: now,
    });

    return modelId;
  } catch (error) {
    console.error("Error creating model:", error);
    throw error;
  }
}

export async function verifyAdminSessionServer() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth`, {
    method: "GET",
    credentials: "include",
  });
  return response.ok;
}

export async function getModel(id: string) {
  try {
    const doc = await db.collection("models").doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data();
    return {
      ...data!,
      createdAt: data!.createdAt?.toDate?.()?.toISOString() || data!.createdAt,
      updatedAt: data!.updatedAt?.toDate?.()?.toISOString() || data!.updatedAt,
    };
  } catch (error) {
    console.error("Error getting model:", error);
    throw error;
  }
}
