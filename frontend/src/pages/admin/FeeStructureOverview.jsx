import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, ChevronDown, ChevronUp, Search, Copy, 
  DollarSign, Settings, History, Eye, Check, X
} from 'lucide-react';
import { feeGroupsAPI, feeItemsAPI, financeAPI } from '../../services/api';
import { API_BASE_URL } from '../../config';

export default function FeeStructureOverview({ onEdit, onClone, onDelete }) {
  const [feeGroups, setFeeGroups] = useState([]);
  const [feeItems, setFeeItems] = useState([]);
  const [feeRules, setFeeRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    fetchData();
    loadExpandState();
  }, []);

  useEffect(() => {
    saveExpandState();
  }, [expandedGroups, expandedItems]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, itemsRes, rulesRes] = await Promise.all([
        feeGroupsAPI.getAll(),
        feeItemsAPI.getAll(),
        financeAPI.getFeeRules()
      ]);
      setFeeGroups(groupsRes.data.fee_groups || []);
      setFeeItems(itemsRes.data.fee_items || []);
      setFeeRules(rulesRes.data.fee_rules || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpandState = () => {
    const saved = localStorage.getItem('feeStructureExpandState');
    if (saved) {
      const { groups, items } = JSON.parse(saved);
      setExpandedGroups(groups || {});
      setExpandedItems(items || {});
    }
  };

  const saveExpandState = () => {
    localStorage.setItem('feeStructureExpandState', JSON.stringify({
      groups: expandedGroups,
      items: expandedItems
    }));
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const toggleItem = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const expandAll = () => {
    const allGroups = {};
    const allItems = {};
    feeGroups.forEach(g => allGroups[g.id] = true);
    feeItems.forEach(i => allItems[i.id] = true);
    setExpandedGroups(allGroups);
    setExpandedItems(allItems);
  };

  const collapseAll = () => {
    setExpandedGroups({});
    setExpandedItems({});
  };

  const getItemsForGroup = (groupId) => {
    return feeItems.filter(item => item.fee_group_id === groupId);
  };

  const getRulesForItem = (itemId) => {
    return feeRules.filter(rule => rule.fee_item_id === itemId);
  };

  const filterData = (data) => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(item => 
      JSON.stringify(item).toLowerCase().includes(lowerSearch)
    );
  };

  const handleClone = async (type, id, name) => {
    try {
      if (type === 'group') {
        // Clone group logic would go here
        alert('Group cloning coming soon');
      } else if (type === 'item') {
        const response = await fetch(`${API_BASE_URL}/finance.php?resource=clone_item`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: id, new_name: `${name} (Copy)` })
        });
        const result = await response.json();
        if (result.success) {
          alert('Item cloned successfully');
          fetchData();
        }
      } else if (type === 'rule') {
        const response = await fetch(`${API_BASE_URL}/finance.php?resource=clone_rule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rule_id: id })
        });
        const result = await response.json();
        if (result.success) {
          alert('Rule cloned successfully');
          fetchData();
        }
      }
    } catch (error) {
      alert('Error cloning: ' + error.message);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      if (type === 'group') await feeGroupsAPI.delete(id);
      else if (type === 'item') await feeItemsAPI.delete(id);
      else if (type === 'rule') await financeAPI.deleteFeeRule(id);
      fetchData();
    } catch (error) {
      alert('Error deleting: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading fee structure...</div>
      </div>
    );
  }

  const filteredGroups = filterData(feeGroups);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups, items, rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
            />
          </div>
          <button
            onClick={expandAll}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Collapse All
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit('group')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Group
          </button>
        </div>
      </div>

      {/* Hierarchical Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No fee groups found. Create your first group to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredGroups.map(group => {
              const groupItems = getItemsForGroup(group.id);
              const filteredItems = filterData(groupItems);
              const isExpanded = expandedGroups[group.id];

              return (
                <div key={group.id} className="group-row">
                  {/* Group Level */}
                  <div 
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleGroup(group.id)}
                  >
                    <button className="p-1 hover:bg-gray-200 rounded">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{group.group_name}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{group.group_code}</span>
                      </div>
                      <div className="text-sm text-gray-500">{group.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit('item', group.id); }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Add Item"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit('group', group.id); }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleClone('group', group.id, group.group_name); }}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Clone"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete('group', group.id); }}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Items Level */}
                  {isExpanded && filteredItems.length > 0 && (
                    <div className="ml-8 pl-4 border-l-2 border-gray-200">
                      {filteredItems.map(item => {
                        const itemRules = getRulesForItem(item.id);
                        const filteredRules = filterData(itemRules);
                        const isItemExpanded = expandedItems[item.id];

                        return (
                          <div key={item.id} className="item-row">
                            {/* Item Row */}
                            <div 
                              className="flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer"
                              onClick={() => toggleItem(item.id)}
                            >
                              <button className="p-1 hover:bg-gray-200 rounded">
                                {isItemExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-800">{item.item_name}</span>
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{item.item_code}</span>
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{item.frequency}</span>
                                </div>
                                <div className="text-xs text-gray-500">{item.description}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); onEdit('rule', item.id); }}
                                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                  title="Add Rule"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onEdit('item', item.id); }}
                                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleClone('item', item.id, item.item_name); }}
                                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                                  title="Clone"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete('item', item.id); }}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Rules Level */}
                            {isItemExpanded && filteredRules.length > 0 && (
                              <div className="ml-8 pl-4 border-l-2 border-gray-200">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class/Level</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {filteredRules.map(rule => (
                                      <tr key={rule.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2">
                                          <div className="text-gray-900">{rule.level || rule.class_id || 'All'}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                          <div className="font-medium text-gray-900">{rule.currency} {rule.amount}</div>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">{rule.academic_year}</td>
                                        <td className="px-3 py-2">
                                          {rule.is_active ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              <Check className="w-3 h-3 mr-1" />
                                              Active
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                              <X className="w-3 h-3 mr-1" />
                                              Inactive
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          <div className="flex items-center justify-end gap-1">
                                            <button
                                              onClick={() => onEdit('rule', rule.id)}
                                              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                              title="Edit"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => handleClone('rule', rule.id)}
                                              className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                                              title="Clone"
                                            >
                                              <Copy className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => handleDelete('rule', rule.id)}
                                              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                              title="Delete"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {filteredRules.length === 0 && (
                                  <div className="text-center py-4 text-gray-500 text-sm">
                                    No rules defined for this item
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {filteredItems.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No items in this group
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
