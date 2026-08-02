import { NextResponse } from "next/server";
import { findWord } from "@/lib/dictionary";


export async function GET(
  request: Request
) {

  const { searchParams } =
    new URL(request.url);


  const word =
    searchParams.get("word");


  if (!word) {

    return NextResponse.json(
      {
        error: "Word is required"
      },
      {
        status: 400
      }
    );

  }


  const result =
    findWord(word);


  if (!result) {

    return NextResponse.json(
      {
        found: false,
        message: "Word not found"
      },
      {
        status: 404
      }
    );

  }


  return NextResponse.json(
    {
      found: true,
      data: result
    }
  );

}