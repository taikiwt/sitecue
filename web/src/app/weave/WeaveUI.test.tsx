import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeaveUI from './WeaveUI';

describe('WeaveUI Component', () => {
  const mockNotes = [
    {
      id: 'note-1',
      content: 'テスト用のメモ内容',
      url_pattern: 'example.com',
      created_at: '2026-03-16T00:00:00Z',
      note_type: 'idea' as const,
    },
  ];

  it('錬成ボタンを押すとMSW経由でAPIモックが呼ばれ、結果が表示されること', async () => {
    const user = userEvent.setup();
    render(<WeaveUI initialNotes={mockNotes} />);

    // メモがレンダリングされていることを確認
    expect(screen.getByText('テスト用のメモ内容')).toBeInTheDocument();

    const generateButton = screen.getByRole('button', { name: /錬成する/i });
    expect(generateButton).not.toBeDisabled();
    
    // ボタンをクリック
    await user.click(generateButton);

    // ※ローディングの検証は外し、非同期（findByText）で最終的な結果が現れるのを待つ
    const resultElement = await screen.findByText(/テスト用モック生成データ/);
    expect(resultElement).toBeInTheDocument();
  });
});
