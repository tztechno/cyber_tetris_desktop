"use client"
import Board from '@/components/Board';
import WinnerAnnouncePop from '@/components/WinnerAnnouncePop';
import { Button } from '@/components/ui/button';
import { isPlacedCorner, listCanPutCell, listCanPutPlayerPerAI, minOpponentPut} from '@/utils/AILogic';
import { BoardState, checkPut, checkPutRowCol, checkWinner, countPiece, initAI, initBoard, initPlayer, makeBoard, Player, Winner } from "@/utils/gameSetting";
import { useEffect, useState } from 'react';

export default function VsAI() {
    const [board, setBoard] = useState<BoardState>(initBoard());
    const [player, setPlayer] = useState<Player>(initPlayer(true));
    const [AI, setAI] = useState<Player>(initAI(player));
    const [winner, setWinner] = useState<Winner>(null);
    const [playingPlayer, setPlayingPlayer] = useState<string>('あなた');
    const [message, setMessage] = useState<string>("");
    let playerTurn = true;
    const [firstTurn, setFirstTurn] = useState<Boolean>(true);

    /**
     * セルを押した時に処理する関数
     * @param row 置いたマスの縦
     * @param col 置いたマスの横
     */
    const cellClick = (row: number, col: number) => {
        //盤面変える
        if(playerTurn){
            const newBoard = makeBoard(board, col, row, player);
            if(checkPut(board, player)){
                if(newBoard){
                    setFirstTurn(false);
                    setBoard(newBoard);
                    setMessage('');
                    setPlayingPlayer('AI');
                    playerTurn = false;
                    const winner = checkWinner(newBoard);
                    if(winner){
                        setWinner(winner);
                    }
                }else{
                    setMessage('そこには置けません');
                }
            }else{
                playerTurn = false;
                const winner = checkWinner(board);
                if(winner){
                    setWinner(winner);
                }
            }
            //AI    
            if(!playerTurn){
                AIMove(newBoard);
            }
        }
    }
    //先攻後攻のボタン処理関数
    const advanceOnClick = () => {
        AIMove(null);
        setFirstTurn(false);
        setPlayingPlayer("AI");
    }

    //AIの関数
    const AIMove = (newBoard: BoardState | null) => {
        const AIBoard = newBoard ? newBoard : board;
        if(checkPut(newBoard ? newBoard : board, AI)){
            //おけるところを配列に
            const canPutAI = listCanPutCell(AIBoard, AI);
            //仮置きしてプレイヤーが置けるところを配列に
            const canPutPlayerPerAI = listCanPutPlayerPerAI(AIBoard, canPutAI, AI);
            //どれだけ試合が進んでるかによってAIのアルゴリズムを変える。
            const countPieces = countPiece(AIBoard);
            if(countPieces.countBlack + countPieces.countWhite <= 48){
                if(!isPlacedCorner(canPutPlayerPerAI)){
                    //角に置かれない一手があるとき
                    //角に置く
                    const cornerAIPut = new Array();
                    for(let i = 0; i < canPutAI.length; i++){
                        if(canPutAI[i] === 0
                            || canPutAI[i] === 7
                            || canPutAI[i] === 56
                            || canPutAI[i] === 63){
                            cornerAIPut.push(canPutAI[i]);
                        }
                    }
                    if(cornerAIPut.length > 0){
                        console.log(cornerAIPut);
                        makeBoardAfterAI(cornerAIPut, AIBoard);
                    }else{
                        //角に置かれてしまう一手を置けるところから削除する
                        for(let i = 0; i < canPutPlayerPerAI.length; i++){
                            for(let j = 0; j < canPutPlayerPerAI[i].length; j++){
                                if(canPutPlayerPerAI[i][j] === 0
                                        || canPutPlayerPerAI[i][j] === 7
                                        || canPutPlayerPerAI[i][j] === 56
                                        || canPutPlayerPerAI[i][j] === 63){
                                    canPutPlayerPerAI.splice(i, 1);
                                    canPutAI.splice(i, 1);
                                    i--;
                                    break;
                                }
                            }
                        }
                        //角前に置かないようにする
                        const canPutPlayerPerAI2 = canPutPlayerPerAI.map(canPutPlayer => [...canPutPlayer]);
                        const canPutAI2 = canPutAI.map(cell => cell);
                        for(let i = 0; i < canPutAI2.length; i++){
                            if(canPutAI2[i] === 9
                                || canPutAI2[i] === 14
                                || canPutAI2[i] === 49
                                || canPutAI2[i] === 54){
                                canPutPlayerPerAI2.splice(i, 1);
                                canPutAI2.splice(i, 1);
                                i--;
                            }
                        }
                        if(canPutAI2.length > 0){
                            //最も相手の手数が少なくなる自分の手を配列に入れる
                            const minOpponentAIPut = minOpponentPut(canPutPlayerPerAI2, canPutAI2);
                            makeBoardAfterAI(minOpponentAIPut, AIBoard);
                        }else{
                            //最も相手の手数が少なくなる自分の手を配列に入れる
                            const minOpponentAIPut = minOpponentPut(canPutPlayerPerAI, canPutAI);
                            makeBoardAfterAI(minOpponentAIPut, AIBoard);
                        }
                    }
                    
                }else{
                    //最も相手の手数が少なくなる自分の手を配列に入れる
                    const minOpponentAIPut = minOpponentPut(canPutPlayerPerAI, canPutAI);
                    makeBoardAfterAI(minOpponentAIPut, AIBoard);
                }
            }else{
                //多く取るようにする
                const AICounts = new Array(canPutAI.length);
                for(let i = 0; i < canPutAI.length; i++){
                    const putAIBoard = makeBoard(AIBoard, Math.trunc(canPutAI[i] % 8), Math.trunc(canPutAI[i] / 8), AI);
                    if(putAIBoard){
                        const countPieces = countPiece(putAIBoard);
                        AICounts[i] = countPieces.countWhite;
                    }
                }
                let maxAICount = AICounts[0];
                let maxAICountIndex = 0;
                //最大値を探す
                for(let i = 1; i < AICounts.length; i++){
                    if(AICounts[i] > maxAICount){
                        maxAICount = AICounts[i];
                        maxAICountIndex = i;
                    }
                }
                //最大値を持つAIが置けるところを配列に
                const maxAIPut = new Array();
                for(let i = 0; i < canPutAI.length; i++){
                    if(maxAICount === AICounts[i]){
                        maxAIPut.push(canPutAI[i]);
                    }
                }
                makeBoardAfterAI(maxAIPut, AIBoard);
            }
        }else{
            setTimeout(() => {
                setPlayingPlayer('あなた');
                playerTurn = true;
                const winner = checkWinner(AIBoard);
                if(winner){
                    setWinner(winner);
                }
            }, 500);
        }
    }

    //AIの一手を反映させる関数
    const makeBoardAfterAI = (canPutAI: number[], newBoard: BoardState | null) => {
        const AIPut = canPutAI[Math.trunc(Math.random() * canPutAI.length)];
        const putAIBoard = makeBoard(newBoard !== null ? newBoard : board, Math.trunc(AIPut % 8), Math.trunc(AIPut / 8), AI);
        if(putAIBoard){
            setTimeout(() => {
                setBoard(putAIBoard);
                setPlayingPlayer('あなた');
                playerTurn = true;
                const winner = checkWinner(putAIBoard);
                if(winner){
                    setWinner(winner);
                }
            }, 500);
        }
    }
        
    /**
     * ゲームを最初からにする関数
     */
    const handleWinnerDismiss = () => {
        setWinner(null);
        setBoard(initBoard()); // ゲームをリセット
        setPlayer(initPlayer(true)); // 初期プレイヤーをセット
        setAI(initAI(player));
        setPlayer('black');
        setFirstTurn(true);
        setPlayingPlayer("あなた");
        playerTurn = true;

    };
    return(
        <div className='flex flex-col items-center'>
            <h2 className='font-bold' style={{fontSize: `25px`}}>AIと対戦する</h2>
            <Board board={board} onCellClick={cellClick}/>
            {!winner && <p>{playingPlayer}のターン</p>}
            {!winner && <p>黒：{countPiece(board).countBlack}　　白：{countPiece(board).countWhite}</p>}
            {firstTurn && <Button variant="destructive" asChild onClick={advanceOnClick}>
                <p>後攻</p>
            </Button>}
            
            <p>{message}</p>
            {winner && <WinnerAnnouncePop winner={winner} onDismiss={handleWinnerDismiss} />}
        </div>
    );
}

