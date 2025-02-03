import { SignedImageUrls } from "@/app/types";
import { getModelsInfo } from "@/lib/actions";
import { decrypt } from "@/lib/encrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { category, prevSignedImageUrls: encryptedPrevsingedImageUrls } = await req.json();

  try {
    const prevSignedImageUrls = JSON.parse(decrypt(encryptedPrevsingedImageUrls)) as SignedImageUrls;
    const { models, signedUrls } = await getModelsInfo(category, prevSignedImageUrls);
    return NextResponse.json({ models, signedUrls }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "모델 업로드에 실패했습니다.", error: error.message || "Unknown error" }, { status: 500 });
  }
}
