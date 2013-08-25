#!/usr/bin/perl
use CGI;
use Data::Dumper;
use DBI;
use utils;

# POST to this - user ID

open STDERR, ">>errors" if $ENV{SERVER_SOFTWARE} =~ m/^mini_httpd/;


my $dbh = DBI->connect("dbi:SQLite:../condition.sqlite","","");

my $q = CGI->new;
print $q->header('text/plain');
my $data = $q->param('POSTDATA');
if(!defined($data)) { $data = $q->param('XForms:Model'); }
if(!defined($data)) { $data = $q->param('u'); }

my $userID = $data+0;

print "Hello user $userID.\n";

# Find any available shard (one with status==0)

sub findShard
{
    my $shardID;
    my $sth = $dbh->prepare("SELECT shardid from shard where (status=0 or status=1) AND inuse=0 ORDER BY random() LIMIT 1;");
    my $rh = $sth->execute();
    my @array = $sth->fetchrow_array();
    if(@array>0) {
        return $array[0];
    }
    return -1;
}

sub forkShard
{
    my $dbh = shift;
    my $fields = "mapUpdates,playerx,playery,flags,status,time,inventory";
    my $sth = $dbh->prepare("SELECT shardid,$fields from shard where (status=0 or status=1) ORDER BY random() LIMIT 1;");
    my $rh = $sth->execute();
    my @array = $sth->fetchrow_array();
    my $oldShardID = shift @array;
    if(@array>0) {
        $sth = $dbh->prepare("INSERT into shard ($fields) VALUES (?,?,?,?,?,?,?);");
        $rh = $sth->execute(@array);
        my $shardID = $dbh->func('last_insert_rowid');
        return $shardID;
    }
    return -1;
}

sub sendStartupInfo
{
    my $shardID = shift;
    # We need to block this shard until we get the results back.
    # Need an 'in use' flag.
    my $sth = $dbh->prepare("UPDATE shard set inuse=1 WHERE shardid=?");
    my $rh = $sth->execute($shardID);
    $sth = $dbh->prepare("SELECT playerx,playery,time,flags,mapUpdates,inventory FROM shard where shardid=?");
    $rh = $sth->execute($shardID);
    my @array=$sth->fetchrow_array();
    print "BEGIN\n";
    print "Coords: $array[0],$array[1]\n";
    print "Time: $array[2]\n";
    print "Flags: $array[3]\n";
    print "MapUpdates: $array[4]\n";
    print "Inventory: $array[5]\n";
    print "Shard: $shardID\n";
    print "Commence playing.\n";
}

touchTimeStamp($dbh,$userID);
my $shardID = findShard();
print "findShard() found shard $shardID for us\n";
if($shardID == -1) {
    print "I need to create a shard.\n";
    if(rand(1)<0.25) {
        # New shard.
        $shardID = newShard($dbh);
        print "Creating a brand new shard ($shardID)\n";
        sendStartupInfo($shardID);
    } else {
        # Forked shard.
        $shardID = forkShard($dbh);
        print "Forked a shard ($shardID)\n";
        if($shardID != -1) {
            sendStartupInfo($shardID);    
        }        
    }
}
else
{
    # We don't record users here - only if they send an update back.
    my $shardStatus = getShardStatus($dbh,$shardID);
    if($shardStatus==0 || $shardStatus==1) {
        sendStartupInfo($shardID);    
    }
    elsif($shardStatus==2) {
        print "Your shard won.\n";
    }
    elsif($shardStatus==3) {
        print "Your shard has died.\n";
    }
}
