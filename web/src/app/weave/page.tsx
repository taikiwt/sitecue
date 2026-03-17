import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import WeaveUI from "./WeaveUI";

export const runtime = "edge";

export default async function WeavePage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/login");
	}

	const { data: notes } = await supabase
		.from("sitecue_notes")
		.select("*")
		.eq("user_id", user.id)
		.order("created_at", { ascending: false });

	return (
		<div className="min-h-screen bg-gray-50 font-sans">
			<nav className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex">
							<div className="shrink-0 flex items-center">
								<a href="/" className="text-xl font-bold hover:text-gray-700">
									SiteCue
								</a>
							</div>
						</div>
						<div className="flex items-center">
							<span className="text-sm text-gray-500 mr-4">{user.email}</span>
							<form
								action={async () => {
									"use server";
									const supabase = await createClient();
									await supabase.auth.signOut();
									redirect("/login");
								}}
							>
								<button
									type="submit"
									className="text-sm font-medium text-gray-700 hover:text-black"
								>
									Sign out
								</button>
							</form>
						</div>
					</div>
				</div>
			</nav>

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="flex justify-between items-center mb-6">
						<h1 className="text-2xl font-semibold text-gray-900">
							Context Weaver
						</h1>
					</div>

					<WeaveUI initialNotes={notes || []} />
				</div>
			</main>
		</div>
	);
}
