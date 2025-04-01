"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const Meeting: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const search = useSearchParams();
  const meet = search.get("meet");

  const sendAction = async (event: React.FormEvent) => {
    try {
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form); // FormDataを生成

      document.querySelector("#submitButton")?.setAttribute("disabled", "");
      // const name = await writeMeetingLog(formData, meet);
      // alert(`${name} さんを出会った記録に登録しました`)
    } catch (e: unknown) {
      console.error("Failed to write item.", e);
      alert("出会った記録の書き込みに失敗しました");
    } finally {
      closeModal();
    }
  };

  return (
    <>
      {meet && (
        <div className="text-center">
          <button
            className="font-bold rounded-lg px-5 py-2 mb-4 w-auto text-slate-200 bg-purple-700 dark:bg-purple-800 hover:opacity-50"
            onClick={openModal}
          >
            Today we&#39;ve met!
          </button>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-slate-400 p-4 rounded-lg text-white w-3/4">
            <form onSubmit={sendAction}>
              <p>
                Toru Takahashiと今日出会ったことを記録します
                <br />
              </p>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full text-slate-800 bg-white"
              />
              <div className="text-slate-300 text-sm mb-2">
                お名前を入力してください。ニックネーム・ハンドルネーム等も可。
              </div>
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="bg-gray-300 hover:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg mr-2"
                >
                  Cancel
                </button>
                <input
                  type="submit"
                  id="submitButton"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg cursor-pointer"
                  value="Send"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Meeting;
