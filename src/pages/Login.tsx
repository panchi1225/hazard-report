import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { masterService } from '../services/masterService';
import { Employee, CompanyType } from '../types';
import { Button } from '../components/Button';
import { APP_NAME_JA, COMMON_USER_PASSWORD, ADMIN_PASSWORD } from '../utils/constants';
import { ShieldAlert, User, Lock, Shield, UserPlus, Building2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedCompanyType, setSelectedCompanyType] = useState<CompanyType | ''>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [isAddingNewUser, setIsAddingNewUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { loginUser, loginAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadEmployees = async () => {
      const data = await masterService.getEmployees();
      setEmployees(data);
    };
    loadEmployees();
  }, []);

  // 選択された会社に該当する社員のみを抽出
  const filteredEmployees = employees.filter(emp => emp.companyType === selectedCompanyType);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isAdminMode) {
        if (!password) throw new Error('パスワードを入れてください');
        if (password !== ADMIN_PASSWORD) throw new Error('パスワードが違います');
        await loginAdmin(password);
      } else {
        if (!selectedCompanyType) {
          throw new Error('会社を選択してください');
        }
        if (!isAddingNewUser && !selectedEmployeeId) {
          throw new Error('名前を選んでください');
        }
        if (isAddingNewUser && !newUserName.trim()) {
          throw new Error('名前を入力してください');
        }
        if (!password) {
          throw new Error('パスワードを入れてください');
        }
        if (password !== COMMON_USER_PASSWORD) {
          throw new Error('パスワードが違います');
        }

        let empId = selectedEmployeeId;
        let empName = '';

        if (isAddingNewUser) {
          // 新規追加してログイン
          const updatedEmployees = await masterService.addEmployee(newUserName.trim(), selectedCompanyType);
          const newEmp = updatedEmployees[updatedEmployees.length - 1];
          empId = newEmp.id;
          empName = newEmp.name;
        } else {
          const employee = employees.find(e => e.id === selectedEmployeeId);
          if (employee) empName = employee.name;
        }

        if (empId && empName) {
          await loginUser(empId, empName, password);
        } else {
          throw new Error('ユーザー情報の取得に失敗しました');
        }
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] min-h-[100dvh] bg-gray-50 overflow-hidden flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-full max-h-full sm:h-auto">
        <div className="bg-blue-800 p-5 sm:p-6 text-center text-white shrink-0 z-10 shadow-sm relative">
          <ShieldAlert size={40} className="mx-auto mb-3 text-yellow-400 sm:w-12 sm:h-12" />
          <h2 className="text-xl sm:text-2xl font-bold">ログインメニュー</h2>
          <p className="text-blue-200 mt-1 sm:mt-2 text-sm sm:text-base">{APP_NAME_JA}</p>
        </div>

        <div className="p-5 sm:p-8 overflow-y-auto">
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6 sm:mb-8">
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-medium rounded-md transition-colors ${!isAdminMode ? 'bg-white shadow text-blue-800' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setIsAdminMode(false); setError(''); setPassword(''); }}
            >
              <div className="flex items-center justify-center gap-2">
                <User size={18} />
                <span>一般ユーザー</span>
              </div>
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-medium rounded-md transition-colors ${isAdminMode ? 'bg-white shadow text-blue-800' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setIsAdminMode(true); setError(''); setPassword(''); }}
            >
              <div className="flex items-center justify-center gap-2">
                <Shield size={18} />
                <span>管理者</span>
              </div>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {!isAdminMode && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-lg">
                    会社を選択
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="text-gray-400" size={20} />
                    </div>
                    <select
                      className="w-full pl-11 pr-4 py-4 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white font-medium"
                      value={selectedCompanyType}
                      onChange={(e) => {
                        setSelectedCompanyType(e.target.value as CompanyType);
                        setSelectedEmployeeId(''); // 会社を変えたら名前をリセット
                      }}
                    >
                      <option value="">-- 会社を選んでください --</option>
                      <option value="matsuura">松浦建設株式会社</option>
                      <option value="partner">協力会社</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-lg">
                    あなたの名前
                  </label>

                  {!isAddingNewUser ? (
                    <>
                      <select
                        className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white font-medium disabled:bg-gray-100 disabled:text-gray-400"
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        disabled={!selectedCompanyType}
                      >
                        <option value="">-- 名前を選んでください --</option>
                        {filteredEmployees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                      {selectedCompanyType && (
                        <button
                          type="button"
                          className="flex items-center gap-1 text-blue-600 font-medium mt-2 hover:underline"
                          onClick={() => {
                            setIsAddingNewUser(true);
                            setSelectedEmployeeId('');
                          }}
                        >
                          <UserPlus size={18} />
                          <span>リストに名前がない場合はこちら</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        placeholder="フルネームを入力"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                      />
                      <div className="text-sm text-gray-500 mt-2">
                        入力した名前は自動的にリストに追加されます
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-blue-600 font-medium mt-2 hover:underline"
                        onClick={() => {
                          setIsAddingNewUser(false);
                          setNewUserName('');
                        }}
                      >
                        リストから選ぶに戻る
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-lg">
                {isAdminMode ? '管理者パスワード' : '共通パスワード'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={24} />
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-lg text-xl font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none tracking-widest"
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium text-center border border-red-200 shadow-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              size="xl" 
              fullWidth 
              disabled={isLoading}
              className="text-xl font-bold mt-8 shadow-md"
            >
              ログイン
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
