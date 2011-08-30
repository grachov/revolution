MODx.panel.Sources = function(config) {
    config = config || {};
    Ext.applyIf(config,{
        id: 'modx-panel-sources'
        ,bodyStyle: ''
        ,defaults: { collapsible: false ,autoHeight: true }
        ,items: [{
            html: '<h2>'+_('sources')+'</h2>'
            ,border: false
            ,id: 'modx-sources-header'
            ,cls: 'modx-page-header'
        },MODx.getPageStructure([{
            layout: 'form'
            ,bodyStyle: 'padding: 15px;'
            ,title: _('sources')
            ,items: [{
                html: '<p>'+_('sources.intro_msg')+'</p>'
                ,border: false
            },{
                xtype: 'modx-grid-sources'
                ,preventRender: true
            }]
        },{
            layout: 'form'
            ,bodyStyle: 'padding: 15px;'
            ,title: _('source_types')
            ,items: [{
                html: '<p>'+_('source_types.intro_msg')+'</p>'
                ,border: false
            },{
                xtype: 'modx-grid-source-types'
                ,preventRender: true
            }]
        }],{
            stateful: true
            ,stateId: 'modx-sources-tabpanel'
            ,stateEvents: ['tabchange']
            ,getState:function() {
                return {activeTab:this.items.indexOf(this.getActiveTab())};
            }
        })]
    });
    MODx.panel.Sources.superclass.constructor.call(this,config);
};
Ext.extend(MODx.panel.Sources,MODx.FormPanel);
Ext.reg('modx-panel-sources',MODx.panel.Sources);

MODx.grid.Sources = function(config) {
    config = config || {};

    this.sm = new Ext.grid.CheckboxSelectionModel();
    Ext.applyIf(config,{
        url: MODx.config.connectors_url+'source/index.php'
        ,fields: ['id','name','description','class_key','cls']
        ,paging: true
        ,autosave: true
        ,remoteSort: true
        ,sm: this.sm
        ,columns: [this.sm,{
            header: _('id')
            ,dataIndex: 'id'
            ,width: 50
            ,sortable: true
        },{
            header: _('name')
            ,dataIndex: 'name'
            ,width: 150
            ,sortable: true
            ,editor: { xtype: 'textfield' ,allowBlank: false }
        },{
            header: _('description')
            ,dataIndex: 'description'
            ,width: 300
            ,sortable: false
            ,editor: { xtype: 'textarea' }
        }]
        ,tbar: [{
            text: _('source_create')
            ,handler: { xtype: 'modx-window-source-create' ,blankValues: true }
        },'-',{
            text: _('bulk_actions')
            ,menu: [{
                text: _('selected_remove')
                ,handler: this.removeSelected
                ,scope: this
            }]
        },'->',{
            xtype: 'textfield'
            ,name: 'search'
            ,id: 'modx-source-search'
            ,emptyText: _('search_ellipsis')
            ,listeners: {
                'change': {fn: this.search, scope: this}
                ,'render': {fn: function(cmp) {
                    new Ext.KeyMap(cmp.getEl(), {
                        key: Ext.EventObject.ENTER
                        ,fn: function() {
                            this.fireEvent('change',this.getValue());
                            this.blur();
                            return true;}
                        ,scope: cmp
                    });
                },scope:this}
            }
        },{
            xtype: 'button'
            ,id: 'modx-filter-clear'
            ,text: _('filter_clear')
            ,listeners: {
                'click': {fn: this.clearFilter, scope: this}
            }
        }]
    });
    MODx.grid.Sources.superclass.constructor.call(this,config);
};
Ext.extend(MODx.grid.Sources,MODx.grid.Grid,{
    getMenu: function() {
        var r = this.getSelectionModel().getSelected();
        var p = r.data.cls;

        var m = [];
        if (this.getSelectionModel().getCount() > 1) {
            m.push({
                text: _('selected_remove')
                ,handler: this.removeSelected
                ,scope: this
            });
        } else {
            if (p.indexOf('pupdate') != -1) {
                m.push({
                    text: _('source_update')
                    ,handler: this.updateSource
                });
            }
            if (p.indexOf('premove') != -1 && r.data.id != 1 && r.data.name != 'Filesystem') {
                if (m.length > 0) m.push('-');
                m.push({
                    text: _('source_remove')
                    ,handler: this.removeSource
                });
            }
        }
        if (m.length > 0) {
            this.addContextMenuItem(m);
        }
    }

    ,createSource: function() {
        location.href = 'index.php?a='+MODx.action['system/source/create'];
    }
    ,removeSelected: function() {
        var cs = this.getSelectedAsList();
        if (cs === false) return false;

        MODx.msg.confirm({
            title: _('source_remove_multiple')
            ,text: _('source_remove_multiple_confirm')
            ,url: this.config.url
            ,params: {
                action: 'removeMultiple'
                ,users: cs
            }
            ,listeners: {
                'success': {fn:function(r) {
                    this.getSelectionModel().clearSelections(true);
                    this.refresh();
                },scope:this}
            }
        });
        return true;
    }

    ,removeSource: function() {
        MODx.msg.confirm({
            title: _('source_remove')
            ,text: _('source_remove_confirm')
            ,url: this.config.url
            ,params: {
                action: 'remove'
                ,id: this.menu.record.id
            }
            ,listeners: {
            	'success': {fn:this.refresh,scope:this}
            }
        });
    }

    ,updateSource: function() {
        location.href = 'index.php?a='+MODx.action['source/update']+'&id='+this.menu.record.id;
    }
    ,search: function(tf,newValue,oldValue) {
        var nv = newValue || tf;
        this.getStore().baseParams.query = Ext.isEmpty(nv) || Ext.isObject(nv) ? '' : nv;
        this.getBottomToolbar().changePage(1);
        this.refresh();
        return true;
    }
    ,clearFilter: function() {
    	this.getStore().baseParams = {
            action: 'getList'
    	};
        Ext.getCmp('modx-source-search').reset();
    	this.getBottomToolbar().changePage(1);
        this.refresh();
    }
});
Ext.reg('modx-grid-sources',MODx.grid.Sources);

/**
 * Generates the create Source window.
 *
 * @class MODx.window.CreateSource
 * @extends MODx.Window
 * @param {Object} config An object of options.
 * @xtype modx-window-source-create
 */
MODx.window.CreateSource = function(config) {
    config = config || {};
    Ext.applyIf(config,{
        title: _('source_create')
        ,url: MODx.config.connectors_url+'source/index.php'
        ,action: 'create'
        ,fields: [{
            xtype: 'textfield'
            ,fieldLabel: _('name')
            ,name: 'name'
            ,anchor: '90%'
            ,allowBlank: false
        },{
            xtype: 'textarea'
            ,fieldLabel: _('description')
            ,name: 'description'
            ,anchor: '90%'
            ,grow: true
        },{
            name: 'class_key'
            ,hiddenName: 'class_key'
            ,xtype: 'modx-combo-source-type'
            ,fieldLabel: _('source_type')
            ,anchor: '90%'
            ,allowBlank: false
        }]
    });
    MODx.window.CreateSource.superclass.constructor.call(this,config);
};
Ext.extend(MODx.window.CreateSource,MODx.Window);
Ext.reg('modx-window-source-create',MODx.window.CreateSource);


MODx.grid.SourceTypes = function(config) {
    config = config || {};

    this.sm = new Ext.grid.CheckboxSelectionModel();
    Ext.applyIf(config,{
        url: MODx.config.connectors_url+'source/type.php'
        ,fields: ['class','name','description']
        ,paging: true
        ,autosave: true
        ,remoteSort: true
        ,columns: [{
            header: _('name')
            ,dataIndex: 'name'
            ,width: 150
            ,sortable: true
            ,editor: { xtype: 'textfield' ,allowBlank: false }
        },{
            header: _('description')
            ,dataIndex: 'description'
            ,width: 300
            ,sortable: false
            ,editor: { xtype: 'textarea' }
        }]
        ,tbar: [/*{
            text: _('source_type_create')
            ,handler: this.createSourceType
            ,scope: this
        },'-',{
            text: _('bulk_actions')
            ,menu: [{
                text: _('selected_remove')
                ,handler: this.removeSelected
                ,scope: this
            }]
        },*/]
    });
    MODx.grid.SourceTypes.superclass.constructor.call(this,config);
};
Ext.extend(MODx.grid.SourceTypes,MODx.grid.Grid,{
    getMenu: function() {
        return [];
        var r = this.getSelectionModel().getSelected();
        var p = r.data.cls;

        var m = [];
        if (this.getSelectionModel().getCount() > 1) {
            m.push({
                text: _('selected_remove')
                ,handler: this.removeSelected
                ,scope: this
            });
        } else {
            if (p.indexOf('pupdate') != -1) {
                m.push({
                    text: _('source_type_update')
                    ,handler: this.updateSourceType
                });
            }
            if (p.indexOf('premove') != -1 && r.data.id != 1 && r.data.name != 'Filesystem') {
                if (m.length > 0) m.push('-');
                m.push({
                    text: _('source_type_remove')
                    ,handler: this.removeSourceType
                });
            }
        }
        if (m.length > 0) {
            this.addContextMenuItem(m);
        }
    }

    ,createSourceType: function() {
        location.href = 'index.php?a='+MODx.action['system/source/type/create'];
    }
    ,removeSelected: function() {
        var cs = this.getSelectedAsList();
        if (cs === false) return false;

        MODx.msg.confirm({
            title: _('source_type_remove_multiple')
            ,text: _('source_type_remove_multiple_confirm')
            ,url: this.config.url
            ,params: {
                action: 'removeMultiple'
                ,users: cs
            }
            ,listeners: {
                'success': {fn:function(r) {
                    this.getSelectionModel().clearSelections(true);
                    this.refresh();
                },scope:this}
            }
        });
        return true;
    }

    ,removeSourceType: function() {
        MODx.msg.confirm({
            title: _('source_type_remove')
            ,text: _('source_type_confirm_remove')
            ,url: this.config.url
            ,params: {
                action: 'remove'
                ,id: this.menu.record.id
            }
            ,listeners: {
            	'success': {fn:this.refresh,scope:this}
            }
        });
    }

    ,updateSourceType: function() {
        location.href = 'index.php?a='+MODx.action['source/type/update']+'&id='+this.menu.record.id;
    }
    ,search: function(tf,newValue,oldValue) {
        var nv = newValue || tf;
        this.getStore().baseParams.query = Ext.isEmpty(nv) || Ext.isObject(nv) ? '' : nv;
        this.getBottomToolbar().changePage(1);
        this.refresh();
        return true;
    }
    ,clearFilter: function() {
    	this.getStore().baseParams = {
            action: 'getList'
    	};
        Ext.getCmp('modx-source-types-search').reset();
    	this.getBottomToolbar().changePage(1);
        this.refresh();
    }
});
Ext.reg('modx-grid-source-types',MODx.grid.SourceTypes);